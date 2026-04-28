"""
tests/test_bias_scorer.py — Unit tests for BiasScorer

Tests that each detector fires on known biased text and scores
clean text highly. Runs without any LLM or DB dependency.
"""

import pytest

from services.api_gateway.schemas.common import BiasType
from services.bias_scorer.scorer import BiasScorer


@pytest.mark.asyncio
async def test_gender_bias_detected(sample_biased_text):
    scorer = BiasScorer()
    score, spans = await scorer.score(sample_biased_text)

    gender_spans = [s for s in spans if s.bias_type == BiasType.GENDER]
    assert len(gender_spans) >= 2, "Expected at least 2 gendered terms"
    assert score.gender < 80.0, f"Gender score should be low, got {score.gender}"
    # Overall is average of 5 dimensions — gender penalty diluted by 4 clean dims
    assert score.overall < 95.0, f"Overall should reflect gender penalty, got {score.overall}"


@pytest.mark.asyncio
async def test_clean_text_scores_high(sample_clean_text):
    scorer = BiasScorer()
    score, spans = await scorer.score(sample_clean_text)

    assert score.overall >= 90.0, f"Clean text should score high, got {score.overall}"
    assert len(spans) == 0


@pytest.mark.asyncio
async def test_empty_text_returns_perfect_score():
    scorer = BiasScorer()
    score, spans = await scorer.score("")

    assert score.overall == 100.0
    assert spans == []


@pytest.mark.asyncio
async def test_businessman_detected():
    scorer = BiasScorer()
    _, spans = await scorer.score("The businessman closed the deal.")
    originals = [s.original.lower() for s in spans]
    assert "businessman" in originals


@pytest.mark.asyncio
async def test_replacement_suggested():
    scorer = BiasScorer()
    _, spans = await scorer.score("He should lead the project.")
    gender_spans = [s for s in spans if s.bias_type == BiasType.GENDER]
    assert any(s.suggested_replacement is not None for s in gender_spans)


@pytest.mark.asyncio
async def test_scores_are_bounded():
    scorer = BiasScorer()
    score, _ = await scorer.score("He should be the manpower behind this businessman venture.")
    assert 0.0 <= score.overall <= 100.0
    assert 0.0 <= score.gender <= 100.0
    assert 0.0 <= score.racial <= 100.0