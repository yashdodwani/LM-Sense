"""
services/bias_scorer/scorer.py — LM-Sense BiasScorer

Detects bias across five dimensions (gender, racial, age, geographic, socioeconomic)
and aggregates them into a single 0–100 fairness score.

Higher score = more fair. Score < BIAS_THRESHOLD (default 0.6 → 60) triggers flagging.

Architecture:
  - Each dimension has a lightweight detector (rule-based + word list).
  - Detectors run in parallel via asyncio.gather.
  - Aggregator combines dimension scores with equal weighting (configurable later).
  - Returns BiasScore + a list of FlaggedSpan candidates for the engine to act on.
"""

import asyncio
import re
from dataclasses import dataclass

from core.config import settings
from core.exceptions import BiasDetectionError
from core.logging import get_logger
from services.api_gateway.schemas.common import BiasScore, BiasType, Severity

logger = get_logger(__name__)

# ── Term lists (inline MVP — move to JSON files in production) ────────────────

GENDERED_TERMS: dict[str, str] = {
    # biased term → neutral replacement
    "he should": "they should",
    "she should": "they should",
    "businessman": "businessperson",
    "manpower": "workforce",
    "stewardess": "flight attendant",
    "fireman": "firefighter",
    "policeman": "police officer",
    "mankind": "humankind",
    "chairman": "chairperson",
    "manmade": "artificial",
    "the guys": "the team",
}

RACIAL_SLURS: set[str] = {
    # intentionally minimal in source — loaded from secure file in production
    # DO NOT expand this list here; use bias_scorer/word_lists/racial_slurs.json
}

AGE_BIAS_PATTERNS: list[str] = [
    r"\bold\s+people\b",
    r"\bolderly\b",
    r"\bseniors?\b",
    r"\byoung\s+and\s+naive\b",
    r"\btoo\s+old\s+to\b",
    r"\btoo\s+young\s+to\b",
]

GEOGRAPHIC_FLAGS: dict[str, float] = {
    # country/region → associated risk penalty (0.0–1.0)
    # Reflects historically discriminatory patterns in training data
    "syria": 0.4,
    "iraq": 0.4,
    "iran": 0.3,
    "north korea": 0.3,
}

SOCIOECONOMIC_PATTERNS: list[str] = [
    r"\bwelfare\s+recipient\b",
    r"\buneducated\b",
    r"\blow[- ]income\s+people\b",
    r"\bpoor\s+neighborhood\b",
    r"\bghetto\b",
]


# ── Span dataclass ────────────────────────────────────────────────────────────

@dataclass
class DetectedSpan:
    """A biased span found during scoring, before engine decides what to do with it."""
    original: str
    suggested_replacement: str | None
    bias_type: BiasType
    severity: Severity
    start_char: int
    end_char: int
    penalty: float          # 0.0–1.0, how much this lowers the score


@dataclass
class DimensionResult:
    bias_type: BiasType
    score: float            # 0.0–100.0, higher = more fair
    spans: list[DetectedSpan]


# ── Per-dimension detectors ───────────────────────────────────────────────────

async def _detect_gender(text: str) -> DimensionResult:
    """
    Rule-based gender bias detector.
    Scans for gendered occupational terms and pronoun assumptions.
    """
    lower = text.lower()
    spans: list[DetectedSpan] = []
    penalty = 0.0

    for biased, neutral in GENDERED_TERMS.items():
        for match in re.finditer(re.escape(biased), lower):
            severity = Severity.MEDIUM
            span_penalty = 0.15
            spans.append(DetectedSpan(
                original=text[match.start():match.end()],
                suggested_replacement=neutral,
                bias_type=BiasType.GENDER,
                severity=severity,
                start_char=match.start(),
                end_char=match.end(),
                penalty=span_penalty,
            ))
            penalty = min(1.0, penalty + span_penalty)

    score = max(0.0, 100.0 - penalty * 100)
    return DimensionResult(bias_type=BiasType.GENDER, score=score, spans=spans)


async def _detect_racial(text: str) -> DimensionResult:
    """
    Racial bias detector — checks for slurs and contextual stereotyping patterns.
    Slur list is loaded from secure file in production; minimal inline for MVP.
    """
    lower = text.lower()
    spans: list[DetectedSpan] = []
    penalty = 0.0

    for slur in RACIAL_SLURS:
        for match in re.finditer(r'\b' + re.escape(slur) + r'\b', lower):
            spans.append(DetectedSpan(
                original=text[match.start():match.end()],
                suggested_replacement="[removed]",
                bias_type=BiasType.RACIAL,
                severity=Severity.HIGH,
                start_char=match.start(),
                end_char=match.end(),
                penalty=0.5,
            ))
            penalty = min(1.0, penalty + 0.5)

    score = max(0.0, 100.0 - penalty * 100)
    return DimensionResult(bias_type=BiasType.RACIAL, score=score, spans=spans)


async def _detect_age(text: str) -> DimensionResult:
    """Age bias detector — pattern-based detection of ageist language."""
    lower = text.lower()
    spans: list[DetectedSpan] = []
    penalty = 0.0

    for pattern in AGE_BIAS_PATTERNS:
        for match in re.finditer(pattern, lower):
            spans.append(DetectedSpan(
                original=text[match.start():match.end()],
                suggested_replacement=None,
                bias_type=BiasType.AGE,
                severity=Severity.LOW,
                start_char=match.start(),
                end_char=match.end(),
                penalty=0.1,
            ))
            penalty = min(1.0, penalty + 0.1)

    score = max(0.0, 100.0 - penalty * 100)
    return DimensionResult(bias_type=BiasType.AGE, score=score, spans=spans)


async def _detect_geographic(text: str) -> DimensionResult:
    """
    Geographic bias detector.
    Flags discriminatory associations between countries/regions and risk/criminality.
    """
    lower = text.lower()
    spans: list[DetectedSpan] = []
    penalty = 0.0

    for region, region_penalty in GEOGRAPHIC_FLAGS.items():
        for match in re.finditer(r'\b' + re.escape(region) + r'\b', lower):
            spans.append(DetectedSpan(
                original=text[match.start():match.end()],
                suggested_replacement=None,
                bias_type=BiasType.GEOGRAPHIC,
                severity=Severity.MEDIUM,
                start_char=match.start(),
                end_char=match.end(),
                penalty=region_penalty,
            ))
            penalty = min(1.0, penalty + region_penalty)

    score = max(0.0, 100.0 - penalty * 100)
    return DimensionResult(bias_type=BiasType.GEOGRAPHIC, score=score, spans=spans)


async def _detect_socioeconomic(text: str) -> DimensionResult:
    """Socioeconomic bias detector — flags stigmatising language about economic status."""
    lower = text.lower()
    spans: list[DetectedSpan] = []
    penalty = 0.0

    for pattern in SOCIOECONOMIC_PATTERNS:
        for match in re.finditer(pattern, lower):
            spans.append(DetectedSpan(
                original=text[match.start():match.end()],
                suggested_replacement=None,
                bias_type=BiasType.SOCIOECONOMIC,
                severity=Severity.MEDIUM,
                start_char=match.start(),
                end_char=match.end(),
                penalty=0.15,
            ))
            penalty = min(1.0, penalty + 0.15)

    score = max(0.0, 100.0 - penalty * 100)
    return DimensionResult(bias_type=BiasType.SOCIOECONOMIC, score=score, spans=spans)


# ── BiasScorer ────────────────────────────────────────────────────────────────

class BiasScorer:
    """
    Main bias scoring entry point.
    Runs all five detectors in parallel and aggregates into BiasScore.

    Usage:
        scorer = BiasScorer()
        score, spans = await scorer.score("He should lead the team.")
    """

    async def score(self, text: str) -> tuple[BiasScore, list[DetectedSpan]]:
        """
        Runs all dimension detectors concurrently.
        Returns (BiasScore, list[DetectedSpan]) where spans are sorted by start_char.
        Raises BiasDetectionError on internal failure.
        """
        if not text or not text.strip():
            return BiasScore(overall=100.0), []

        try:
            results: list[DimensionResult] = await asyncio.gather(
                _detect_gender(text),
                _detect_racial(text),
                _detect_age(text),
                _detect_geographic(text),
                _detect_socioeconomic(text),
            )
        except Exception as exc:
            raise BiasDetectionError("Bias detection failed", detail=str(exc)) from exc

        dim_scores = {r.bias_type: r.score for r in results}
        all_spans = sorted(
            [span for r in results for span in r.spans],
            key=lambda s: s.start_char,
        )

        # Equal-weight average across all five dimensions
        overall = sum(dim_scores.values()) / len(dim_scores)

        bias_score = BiasScore(
            overall=round(overall, 2),
            gender=round(dim_scores[BiasType.GENDER], 2),
            racial=round(dim_scores[BiasType.RACIAL], 2),
            age=round(dim_scores[BiasType.AGE], 2),
            geographic=round(dim_scores[BiasType.GEOGRAPHIC], 2),
            socioeconomic=round(dim_scores[BiasType.SOCIOECONOMIC], 2),
        )

        logger.debug(
            "bias_scorer.result",
            overall=bias_score.overall,
            spans_found=len(all_spans),
            text_len=len(text),
        )

        return bias_score, all_spans