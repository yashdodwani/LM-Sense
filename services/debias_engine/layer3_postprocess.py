"""
services/debias_engine/layer3_postprocess.py — LM-Sense Layer 3: RL Post-processing

The inference-time debiasing guard. Runs on every response, no training required.
Takes the output of BiasScorer (detected spans) and applies one of three actions:
  - REWRITE: replaces biased spans with neutral alternatives
  - FLAG:    passes the text through unchanged but marks it
  - BLOCK:   suppresses the response entirely

This layer runs last in the pipeline. It's the fastest safety net and the
one that catches anything Layers 1 and 2 missed at runtime.
"""

import time

from core.config import settings
from core.logging import get_logger
from services.api_gateway.schemas.common import ActionOnDetection, LayerName, LayerTrace, Severity
from services.bias_scorer.scorer import BiasScorer, DetectedSpan

logger = get_logger(__name__)

# Severity → minimum score threshold for rewriting (below = rewrite)
SEVERITY_REWRITE_THRESHOLD: dict[Severity, float] = {
    Severity.HIGH:   80.0,   # always rewrite
    Severity.MEDIUM: 65.0,   # rewrite if score below 65
    Severity.LOW:    50.0,   # only rewrite if score very low
    Severity.NONE:   0.0,    # never rewrite
}


class Layer3Postprocess:
    """
    Layer 3 — RL post-processing guard.

    Instantiate once and reuse. Stateless per-call.
    Config (action, sensitivity, blocklist) comes from tenant's PipelineConfig.

    Usage:
        layer = Layer3Postprocess()
        text_out, trace, spans = await layer.run(
            text=raw_text,
            detected_spans=spans_from_scorer,
            bias_score_before=score,
            action=ActionOnDetection.REWRITE,
            sensitivity="medium",
            custom_blocklist=[],
        )
    """

    def __init__(self) -> None:
        self._scorer = BiasScorer()

    async def run(
        self,
        text: str,
        detected_spans: list[DetectedSpan],
        bias_score_before_overall: float,
        action: ActionOnDetection = ActionOnDetection.REWRITE,
        sensitivity: str = "medium",
        custom_blocklist: list[str] | None = None,
    ) -> tuple[str, LayerTrace, list[DetectedSpan]]:
        """
        Applies the configured action to the detected spans.

        Returns:
            (output_text, layer_trace, acted_spans)
            - output_text: the corrected (or original) text
            - layer_trace: what this layer did, for the audit trail
            - acted_spans: the spans that were actually modified
        """
        start = time.monotonic()
        custom_blocklist = custom_blocklist or []

        # Merge custom blocklist hits into spans
        blocklist_spans = self._scan_blocklist(text, custom_blocklist)
        all_spans = detected_spans + blocklist_spans

        # Filter spans by sensitivity threshold
        active_spans = self._filter_by_sensitivity(all_spans, sensitivity)

        if not active_spans:
            # Nothing to act on — pass through cleanly
            trace = LayerTrace(
                layer=LayerName.POSTPROCESS,
                triggered=False,
                changes_made=0,
                score_before=bias_score_before_overall,
                score_after=bias_score_before_overall,
                duration_ms=round((time.monotonic() - start) * 1000, 2),
                notes="No spans above sensitivity threshold",
            )
            return text, trace, []

        output_text = text
        acted_spans: list[DetectedSpan] = []

        if action == ActionOnDetection.BLOCK:
            output_text = self._block_response(active_spans)
            acted_spans = active_spans

        elif action == ActionOnDetection.REWRITE:
            output_text, acted_spans = self._rewrite_spans(text, active_spans)

        elif action == ActionOnDetection.FLAG:
            # Pass text through unchanged — caller will mark as flagged
            acted_spans = active_spans

        # Re-score the output to measure improvement
        score_after_obj, _ = await self._scorer.score(output_text)
        score_after = score_after_obj.overall

        duration_ms = round((time.monotonic() - start) * 1000, 2)

        trace = LayerTrace(
            layer=LayerName.POSTPROCESS,
            triggered=True,
            changes_made=len(acted_spans),
            score_before=bias_score_before_overall,
            score_after=score_after,
            duration_ms=duration_ms,
            notes=f"action={action}, sensitivity={sensitivity}, spans={len(active_spans)}",
        )

        logger.info(
            "layer3.complete",
            action=action,
            spans_acted=len(acted_spans),
            score_before=bias_score_before_overall,
            score_after=score_after,
            duration_ms=duration_ms,
        )

        return output_text, trace, acted_spans

    def _filter_by_sensitivity(
        self, spans: list[DetectedSpan], sensitivity: str
    ) -> list[DetectedSpan]:
        """
        Filters spans based on sensitivity setting.
          low    → only HIGH severity spans
          medium → HIGH + MEDIUM severity spans
          high   → all spans including LOW severity
        """
        allowed: set[Severity] = {Severity.HIGH}
        if sensitivity in ("medium", "high"):
            allowed.add(Severity.MEDIUM)
        if sensitivity == "high":
            allowed.add(Severity.LOW)
        return [s for s in spans if s.severity in allowed]

    def _rewrite_spans(
        self, text: str, spans: list[DetectedSpan]
    ) -> tuple[str, list[DetectedSpan]]:
        """
        Replaces biased spans in the text with their suggested neutral replacement.
        Works right-to-left on character offsets so replacements don't shift indices.
        Only rewrites spans that have a suggested_replacement.
        """
        acted: list[DetectedSpan] = []
        # Sort descending by start_char so replacements don't shift positions
        rewritable = [s for s in spans if s.suggested_replacement is not None]
        rewritable.sort(key=lambda s: s.start_char, reverse=True)

        result = text
        for span in rewritable:
            result = result[:span.start_char] + span.suggested_replacement + result[span.end_char:]
            acted.append(span)

        # For spans without replacements, just collect as flagged
        flagged_only = [s for s in spans if s.suggested_replacement is None]
        acted.extend(flagged_only)

        return result, acted

    def _block_response(self, spans: list[DetectedSpan]) -> str:
        """
        Blocks the entire response and returns an explanation.
        Used when action=BLOCK and bias score is critically low.
        """
        bias_types = list({s.bias_type.value for s in spans})
        return (
            f"[LM-Sense] This response was blocked because it contained "
            f"potentially biased content ({', '.join(bias_types)}). "
            f"Please rephrase your prompt or contact your administrator."
        )

    def _scan_blocklist(self, text: str, blocklist: list[str]) -> list[DetectedSpan]:
        """
        Scans text for custom domain-specific blocked phrases.
        Always treated as HIGH severity.
        """
        import re
        lower = text.lower()
        spans: list[DetectedSpan] = []

        for phrase in blocklist:
            for match in re.finditer(re.escape(phrase.lower()), lower):
                spans.append(DetectedSpan(
                    original=text[match.start():match.end()],
                    suggested_replacement=None,
                    bias_type=from_text_bias_type(phrase),
                    severity=Severity.HIGH,
                    start_char=match.start(),
                    end_char=match.end(),
                    penalty=0.4,
                ))
        return spans


def from_text_bias_type(phrase: str):
    """Heuristic — infer bias type from phrase. Defaults to UNKNOWN."""
    from services.api_gateway.schemas.common import BiasType
    phrase = phrase.lower()
    if any(w in phrase for w in ["he", "she", "man", "woman", "gender"]):
        return BiasType.GENDER
    if any(w in phrase for w in ["race", "ethnic", "color"]):
        return BiasType.RACIAL
    return BiasType.UNKNOWN