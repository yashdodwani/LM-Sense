"""
tests/test_debias_engine.py — Unit tests for DebiasEngine + Layer 3

Tests the full pipeline orchestration and Layer 3 post-processing
without any LLM calls (Layers 1 and 2 will be pass-through stubs).
"""

import pytest

from services.api_gateway.schemas.common import ActionOnDetection, LayerName
from services.debias_engine.engine import DebiasEngine
from services.debias_engine.layer3_postprocess import Layer3Postprocess


@pytest.mark.asyncio
async def test_engine_returns_debias_result(sample_biased_text, sample_pipeline_config):
    engine = DebiasEngine()
    result = await engine.run(
        prompt="Write a job description for a team lead.",
        raw_response=sample_biased_text,
        config=sample_pipeline_config,
        tenant_id="test-tenant",
        request_id="test-req-001",
        model="gpt-4o",
        requested_layers=[LayerName.POSTPROCESS],  # only L3 — no LLM needed
    )

    assert result.debiased_response != ""
    assert result.bias_score_before is not None
    assert result.bias_score_after is not None
    assert LayerName.POSTPROCESS in result.layers_applied
    assert result.processing_time_ms > 0


@pytest.mark.asyncio
async def test_engine_clean_text_passes_through(sample_clean_text, sample_pipeline_config):
    engine = DebiasEngine()
    result = await engine.run(
        prompt="Write a job description.",
        raw_response=sample_clean_text,
        config=sample_pipeline_config,
        tenant_id="test-tenant",
        request_id="test-req-002",
        model="gpt-4o",
        requested_layers=[LayerName.POSTPROCESS],
    )

    assert result.action_taken == "clean"
    assert result.debiased_response == sample_clean_text
    assert result.flagged_spans == []


@pytest.mark.asyncio
async def test_layer3_rewrite(sample_biased_text, sample_detected_spans):
    layer = Layer3Postprocess()
    output, trace, acted = await layer.run(
        text=sample_biased_text,
        detected_spans=sample_detected_spans,
        bias_score_before_overall=55.0,
        action=ActionOnDetection.REWRITE,
        sensitivity="medium",
    )

    assert "businessman" not in output.lower() or "businessperson" in output.lower()
    assert trace.triggered is True
    assert trace.changes_made > 0
    assert len(acted) > 0


@pytest.mark.asyncio
async def test_layer3_flag_does_not_change_text(sample_biased_text, sample_detected_spans):
    layer = Layer3Postprocess()
    output, trace, acted = await layer.run(
        text=sample_biased_text,
        detected_spans=sample_detected_spans,
        bias_score_before_overall=55.0,
        action=ActionOnDetection.FLAG,
        sensitivity="medium",
    )

    assert output == sample_biased_text   # text unchanged
    assert trace.triggered is True
    assert len(acted) > 0                  # but spans are still collected


@pytest.mark.asyncio
async def test_layer3_block_returns_explanation(sample_biased_text, sample_detected_spans):
    layer = Layer3Postprocess()
    output, trace, acted = await layer.run(
        text=sample_biased_text,
        detected_spans=sample_detected_spans,
        bias_score_before_overall=30.0,
        action=ActionOnDetection.BLOCK,
        sensitivity="medium",
    )

    assert "[LM-Sense]" in output
    assert "blocked" in output.lower()


@pytest.mark.asyncio
async def test_layer3_custom_blocklist(sample_clean_text):
    layer = Layer3Postprocess()
    output, trace, acted = await layer.run(
        text=sample_clean_text + " This is a restricted phrase.",
        detected_spans=[],
        bias_score_before_overall=95.0,
        action=ActionOnDetection.FLAG,
        sensitivity="high",
        custom_blocklist=["restricted phrase"],
    )

    assert trace.triggered is True
    assert any("restricted phrase" in s.original for s in acted)


@pytest.mark.asyncio
async def test_layer3_low_sensitivity_ignores_low_severity(sample_detected_spans):
    """Low sensitivity should only act on HIGH severity spans."""
    layer = Layer3Postprocess()
    # All sample spans are MEDIUM — low sensitivity should skip them
    output, trace, acted = await layer.run(
        text="He should be a businessman.",
        detected_spans=sample_detected_spans,
        bias_score_before_overall=60.0,
        action=ActionOnDetection.REWRITE,
        sensitivity="low",   # only HIGH severity
    )

    assert trace.triggered is False
    assert len(acted) == 0


@pytest.mark.asyncio
async def test_engine_layer_order_respected(sample_biased_text, sample_pipeline_config):
    """Layers should execute in fixed order L1 → L2 → L3."""
    engine = DebiasEngine()
    result = await engine.run(
        prompt="test",
        raw_response=sample_biased_text,
        config=sample_pipeline_config,
        tenant_id="test-tenant",
        request_id="test-req-003",
        model="gpt-4o",
        requested_layers=[LayerName.QLORA_CDA, LayerName.POSTPROCESS],
    )

    layer_names = [t.layer for t in result.layer_trace]
    qlora_idx = layer_names.index(LayerName.QLORA_CDA)
    post_idx = layer_names.index(LayerName.POSTPROCESS)
    assert qlora_idx < post_idx