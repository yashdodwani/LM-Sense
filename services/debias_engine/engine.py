"""
services/debias_engine/engine.py — LM-Sense DebiasEngine

The central orchestrator of the three-layer debiasing pipeline.
Called by the /v1/debias and /v1/sandbox routers.

Pipeline (each layer receives the previous layer's output):
    raw_response
        → [Layer 1: QLoRA + CDA]   — training-time fairness adapter
        → [Layer 2: RLDF]          — reward model + AI judge rewrite
        → [Layer 3: Post-process]  — runtime span rewrite / flag / block
        → DebiasResult

Layers are independently togglable per tenant via PipelineConfig.
A singleton instance is created at app startup and shared across requests.
"""

import uuid
from time import monotonic

from core.config import settings
from core.exceptions import DebiasEngineError
from core.logging import get_logger
from services.api_gateway.schemas.common import (
    ActionOnDetection, BiasScore, LayerName, LayerTrace, Severity
)
from services.api_gateway.schemas.pipeline import PipelineConfig
from services.bias_scorer.scorer import BiasScorer
from services.debias_engine.orchestrator import PipelineOrchestrator
from services.debias_engine.result import DebiasResult, FlaggedSpan

logger = get_logger(__name__)


class DebiasEngine:
    """
    Main debiasing pipeline engine.

    Usage (from a router):
        engine = get_debias_engine()
        result = await engine.run(
            prompt=body.prompt,
            raw_response=body.raw_response,
            config=pipeline_config,
            tenant_id=str(ctx.tenant_id),
            request_id=request_id,
            model=body.model,
            requested_layers=body.layers,
        )
    """

    def __init__(self) -> None:
        self._scorer = BiasScorer()
        self._orchestrator = PipelineOrchestrator()

    async def run(
        self,
        prompt: str,
        raw_response: str,
        config: PipelineConfig,
        tenant_id: str,
        request_id: str,
        model: str,
        requested_layers: list[LayerName] | None = None,
    ) -> DebiasResult:
        """
        Runs raw_response through all enabled layers in sequence.

        Each layer receives the output of the previous one.
        All layer traces are collected into the final DebiasResult.
        Raises DebiasEngineError on unrecoverable pipeline failure.
        """
        start = monotonic()

        # ── Step 1: Score the raw input ───────────────────────────────────
        try:
            score_before, detected_spans = await self._scorer.score(raw_response)
        except Exception as exc:
            raise DebiasEngineError("Initial bias scoring failed", detail=str(exc)) from exc

        logger.info(
            "engine.run.start",
            request_id=request_id,
            score_before=score_before.overall,
            spans_detected=len(detected_spans),
            tenant_id=tenant_id,
        )

        # ── Step 2: Determine active layers ───────────────────────────────
        active_layers = self._orchestrator.get_active_layers(config, requested_layers)

        # ── Step 3: Run layers in sequence ────────────────────────────────
        current_text = raw_response
        all_traces: list[LayerTrace] = []
        all_acted_spans: list[FlaggedSpan] = []

        for layer_name in active_layers:
            try:
                current_text, trace, acted = await self._run_layer(
                    layer_name=layer_name,
                    text=current_text,
                    score_before=score_before.overall,
                    detected_spans=detected_spans,
                    config=config,
                )
                all_traces.append(trace)
                all_acted_spans.extend(self._convert_spans(acted))
            except Exception as exc:
                # Layer failure is non-fatal — log, record, continue
                logger.warning(
                    "engine.layer.failed",
                    layer=layer_name,
                    error=str(exc),
                    request_id=request_id,
                )
                all_traces.append(LayerTrace(
                    layer=layer_name,
                    triggered=False,
                    changes_made=0,
                    score_before=score_before.overall,
                    score_after=score_before.overall,
                    duration_ms=0.0,
                    notes=f"Layer failed: {str(exc)[:100]}",
                ))

        # ── Step 4: Final score ───────────────────────────────────────────
        try:
            score_after, _ = await self._scorer.score(current_text)
        except Exception:
            score_after = score_before  # safe fallback

        # ── Step 5: Determine action taken ────────────────────────────────
        action_taken = self._determine_action(
            original=raw_response,
            output=current_text,
            spans=all_acted_spans,
            config=config,
        )

        processing_time_ms = round((monotonic() - start) * 1000, 2)

        logger.info(
            "engine.run.complete",
            request_id=request_id,
            score_before=score_before.overall,
            score_after=score_after.overall,
            action_taken=action_taken,
            layers_applied=active_layers,
            processing_time_ms=processing_time_ms,
        )

        return DebiasResult(
            request_id=request_id,
            model=model,
            raw_response=raw_response,
            debiased_response=current_text,
            action_taken=action_taken,
            bias_score_before=score_before,
            bias_score_after=score_after,
            flagged_spans=all_acted_spans,
            layer_trace=all_traces,
            layers_applied=active_layers,
            processing_time_ms=processing_time_ms,
        )

    async def _run_layer(
        self, layer_name: LayerName, text: str,
        score_before: float, detected_spans, config: PipelineConfig,
    ) -> tuple[str, LayerTrace, list]:
        """Dispatches to the correct layer instance."""

        if layer_name == LayerName.QLORA_CDA:
            layer = self._orchestrator.get_layer1()
            out_text, trace = await layer.run(
                text=text,
                score_before=score_before,
                lora_rank=config.layer1_qlora.lora_rank,
            )
            return out_text, trace, []

        elif layer_name == LayerName.RLDF:
            layer = self._orchestrator.get_layer2()
            out_text, trace = await layer.run(
                text=text,
                score_before=score_before,
                fairness_lambda=config.layer2_rldf.fairness_lambda,
                debate_rounds=config.layer2_rldf.debate_rounds,
            )
            return out_text, trace, []

        elif layer_name == LayerName.POSTPROCESS:
            layer = self._orchestrator.get_layer3()
            out_text, trace, acted_spans = await layer.run(
                text=text,
                detected_spans=detected_spans,
                bias_score_before_overall=score_before,
                action=ActionOnDetection(config.layer3_postprocess.action_on_detection),
                sensitivity=config.layer3_postprocess.bias_sensitivity,
                custom_blocklist=config.layer3_postprocess.custom_blocklist,
            )
            return out_text, trace, acted_spans

        else:
            raise DebiasEngineError(f"Unknown layer: {layer_name}")

    def _convert_spans(self, engine_spans: list) -> list[FlaggedSpan]:
        """Converts bias_scorer DetectedSpan → engine FlaggedSpan."""
        result = []
        for s in engine_spans:
            result.append(FlaggedSpan(
                original=s.original,
                replacement=s.suggested_replacement,
                bias_type=s.bias_type,
                severity=s.severity,
                start_char=s.start_char,
                end_char=s.end_char,
            ))
        return result

    def _determine_action(
        self, original: str, output: str,
        spans: list[FlaggedSpan], config: PipelineConfig
    ) -> str:
        """Returns a human-readable label for what the pipeline did."""
        action = config.layer3_postprocess.action_on_detection
        if action == ActionOnDetection.BLOCK and output != original:
            return "blocked"
        if not spans:
            return "clean"
        if output != original:
            return "rewritten"
        return "flagged"


# ── Singleton ─────────────────────────────────────────────────────────────────

_engine: DebiasEngine | None = None


def get_debias_engine() -> DebiasEngine:
    """Returns the shared DebiasEngine singleton. Safe to call from any router."""
    global _engine
    if _engine is None:
        _engine = DebiasEngine()
    return _engine