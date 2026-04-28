"""
services/debias_engine/layer1_qlora.py — LM-Sense Layer 1: QLoRA + CDA Adapter

Loads a fine-tuned QLoRA adapter (trained via ml/qlora/train.py) and runs
inference to produce a less-biased version of the input text.

At MVP, this layer is a pass-through stub — the adapter must be trained first
using ml/qlora/train.py + ml/cda/pipeline.py before this activates.
Layer 3 (post-processing) handles debiasing in the meantime.

To activate:
    1. Run: python ml/cda/pipeline.py --dataset your_data.jsonl
    2. Run: python ml/qlora/train.py --output_dir adapters/lm-sense-v1
    3. Set QLORA_ADAPTER_PATH=adapters/lm-sense-v1 in .env
"""

import os
import time

from core.config import settings
from core.logging import get_logger
from services.api_gateway.schemas.common import LayerName, LayerTrace

logger = get_logger(__name__)

# Set via env when adapter is ready
ADAPTER_PATH = os.getenv("QLORA_ADAPTER_PATH", None)


class Layer1QLoRA:
    """
    Layer 1 — QLoRA fine-tuned adapter.

    Loads the adapter on first use (lazy load) to avoid blocking startup.
    Falls back to pass-through if no adapter path is configured.

    Usage:
        layer = Layer1QLoRA()
        text_out, trace = await layer.run(text, score_before, config)
    """

    def __init__(self) -> None:
        self._model = None
        self._tokenizer = None
        self._loaded = False

    def _load_adapter(self) -> bool:
        """
        Lazily loads the QLoRA adapter + base model.
        Returns True if loaded, False if no adapter configured (pass-through mode).
        """
        if self._loaded:
            return self._model is not None

        if not ADAPTER_PATH:
            logger.info("layer1.qlora.passthrough", reason="QLORA_ADAPTER_PATH not set")
            self._loaded = True
            return False

        try:
            # Lazy import — torch/transformers are heavy
            from peft import PeftModel
            from transformers import AutoModelForCausalLM, AutoTokenizer

            logger.info("layer1.qlora.loading", adapter_path=ADAPTER_PATH)
            base_model_id = os.getenv("QLORA_BASE_MODEL", "facebook/opt-1.3b")

            self._tokenizer = AutoTokenizer.from_pretrained(base_model_id)
            base = AutoModelForCausalLM.from_pretrained(
                base_model_id, load_in_4bit=True, device_map="auto"
            )
            self._model = PeftModel.from_pretrained(base, ADAPTER_PATH)
            self._model.eval()
            self._loaded = True
            logger.info("layer1.qlora.loaded", adapter_path=ADAPTER_PATH)
            return True

        except Exception as exc:
            logger.warning("layer1.qlora.load_failed", error=str(exc))
            self._loaded = True
            return False

    async def run(
        self,
        text: str,
        score_before: float,
        lora_rank: int = 16,
    ) -> tuple[str, LayerTrace]:
        """
        Runs the text through the QLoRA-adapted model.
        If no adapter is loaded, returns the text unchanged (pass-through).

        Returns (output_text, LayerTrace)
        """
        start = time.monotonic()
        adapter_ready = self._load_adapter()

        if not adapter_ready:
            # Pass-through — Layer 3 handles the debiasing instead
            return text, LayerTrace(
                layer=LayerName.QLORA_CDA,
                triggered=False,
                changes_made=0,
                score_before=score_before,
                score_after=score_before,
                duration_ms=round((time.monotonic() - start) * 1000, 2),
                notes="Pass-through: adapter not loaded. Train via ml/qlora/train.py first.",
            )

        try:
            output_text = await self._run_inference(text)
        except Exception as exc:
            logger.warning("layer1.qlora.inference_failed", error=str(exc))
            output_text = text  # safe fallback

        duration_ms = round((time.monotonic() - start) * 1000, 2)

        return output_text, LayerTrace(
            layer=LayerName.QLORA_CDA,
            triggered=True,
            changes_made=1 if output_text != text else 0,
            score_before=score_before,
            score_after=score_before,   # scorer will re-evaluate after all layers
            duration_ms=duration_ms,
        )

    async def _run_inference(self, text: str) -> str:
        """
        Tokenizes text, runs the adapted model, decodes output.
        Runs in a thread executor to avoid blocking the event loop.
        """
        import asyncio

        def _infer() -> str:
            import torch
            prompt = f"Rewrite the following text to remove bias:\n\n{text}\n\nRewritten:"
            inputs = self._tokenizer(prompt, return_tensors="pt").to(self._model.device)
            with torch.no_grad():
                outputs = self._model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.3,
                    do_sample=True,
                    pad_token_id=self._tokenizer.eos_token_id,
                )
            decoded = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            # Extract just the rewritten part after the prompt
            if "Rewritten:" in decoded:
                return decoded.split("Rewritten:")[-1].strip()
            return decoded.strip()

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _infer)