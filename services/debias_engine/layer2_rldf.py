"""
services/debias_engine/layer2_rldf.py — LM-Sense Layer 2: RLDF Adapter

Applies the Reinforcement Learning from Multi-role Debates (RLDF) correction.
At inference time, this calls the reward model (AI judge) to score the text
and optionally rewrites it if the score is below the fairness threshold.

The reward model is the same one used during RLDF training (ml/rldf/train.py).
At MVP, this is a pass-through stub until the reward model service is ready.

Activation path:
    1. Train reward model: python ml/rldf/train.py
    2. Start reward model service: uvicorn services.reward_model.judge:app
    3. Set REWARD_MODEL_URL in .env
"""

import os
import time

import httpx

from core.config import settings
from core.exceptions import RewardModelError
from core.logging import get_logger
from services.api_gateway.schemas.common import LayerName, LayerTrace

logger = get_logger(__name__)

REWARD_MODEL_URL = os.getenv("REWARD_MODEL_URL", "http://localhost:8004")


class Layer2RLDF:
    """
    Layer 2 — RLDF inference-time correction.

    Calls the reward model service to score the current text,
    then uses the AI judge (LLM) to rewrite if score is poor.

    Usage:
        layer = Layer2RLDF()
        text_out, trace = await layer.run(text, score_before, config)
    """

    def __init__(self) -> None:
        self._http = httpx.AsyncClient(timeout=30.0)

    async def run(
        self,
        text: str,
        score_before: float,
        fairness_lambda: float = 0.7,
        debate_rounds: int = 2,
    ) -> tuple[str, LayerTrace]:
        """
        Scores the text via the reward model.
        If score is below threshold, requests a rewrite from the AI judge.

        Returns (output_text, LayerTrace)
        """
        start = time.monotonic()

        if not REWARD_MODEL_URL:
            return text, LayerTrace(
                layer=LayerName.RLDF,
                triggered=False,
                changes_made=0,
                score_before=score_before,
                score_after=score_before,
                duration_ms=round((time.monotonic() - start) * 1000, 2),
                notes="Pass-through: REWARD_MODEL_URL not set. Deploy reward model service first.",
            )

        try:
            reward_score = await self._get_reward_score(text)
        except RewardModelError as exc:
            logger.warning("layer2.rldf.reward_model_error", error=exc.message)
            # Fail open — pass text through
            return text, LayerTrace(
                layer=LayerName.RLDF,
                triggered=False,
                changes_made=0,
                score_before=score_before,
                score_after=score_before,
                duration_ms=round((time.monotonic() - start) * 1000, 2),
                notes=f"Reward model unavailable: {exc.message}",
            )

        threshold = settings.BIAS_THRESHOLD * 100  # convert 0–1 to 0–100
        needs_rewrite = reward_score < threshold

        output_text = text
        if needs_rewrite:
            output_text = await self._rewrite_via_judge(text, reward_score, fairness_lambda)

        duration_ms = round((time.monotonic() - start) * 1000, 2)

        return output_text, LayerTrace(
            layer=LayerName.RLDF,
            triggered=needs_rewrite,
            changes_made=1 if output_text != text else 0,
            score_before=score_before,
            score_after=reward_score,
            duration_ms=duration_ms,
            notes=f"reward_score={reward_score:.1f}, lambda={fairness_lambda}",
        )

    async def _get_reward_score(self, text: str) -> float:
        """
        Calls the reward model microservice to score text fairness.
        Returns a 0–100 fairness score.
        """
        try:
            resp = await self._http.post(
                f"{REWARD_MODEL_URL}/score",
                json={"text": text},
            )
            resp.raise_for_status()
            return float(resp.json()["score"])
        except Exception as exc:
            raise RewardModelError("Reward model scoring failed", detail=str(exc)) from exc

    async def _rewrite_via_judge(
        self, text: str, reward_score: float, fairness_lambda: float
    ) -> str:
        """
        Asks the AI judge (LLM) to produce a fairer version of the text.
        Uses a structured prompt that balances fairness vs fluency via lambda.
        """
        from core.llm_client import get_llm_client

        llm = get_llm_client()
        fluency_weight = round(1.0 - fairness_lambda, 2)

        system = (
            "You are a bias correction assistant. "
            "Rewrite the given text to be fairer and less biased, "
            f"with {int(fairness_lambda * 100)}% weight on fairness "
            f"and {int(fluency_weight * 100)}% weight on preserving the original meaning. "
            "Return only the rewritten text — no explanation."
        )
        prompt = f"Text to rewrite:\n\n{text}"

        try:
            response = await llm.complete(
                model=settings.REWARD_MODEL,
                prompt=prompt,
                system=system,
                temperature=0.2,
            )
            return response.text.strip()
        except Exception as exc:
            logger.warning("layer2.rldf.rewrite_failed", error=str(exc))
            return text  # safe fallback

    async def close(self) -> None:
        await self._http.aclose()