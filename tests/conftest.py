"""
tests/conftest.py — LM-Sense pytest fixtures

Shared fixtures for all tests: mock LLM client, sample payloads,
test pipeline config, and a mock bias scorer for unit tests.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from services.api_gateway.schemas.common import BiasScore, BiasType, Severity
from services.api_gateway.schemas.pipeline import PipelineConfig
from services.bias_scorer.scorer import DetectedSpan


@pytest.fixture
def sample_biased_text() -> str:
    return "He should be a strong businessman with manpower to lead the team."


@pytest.fixture
def sample_clean_text() -> str:
    return "They should be a strong business leader with a capable workforce."


@pytest.fixture
def sample_pipeline_config() -> PipelineConfig:
    return PipelineConfig(tenant_id="test-tenant-123")


@pytest.fixture
def sample_detected_spans() -> list[DetectedSpan]:
    return [
        DetectedSpan(
            original="he should",
            suggested_replacement="they should",
            bias_type=BiasType.GENDER,
            severity=Severity.MEDIUM,
            start_char=0,
            end_char=9,
            penalty=0.15,
        ),
        DetectedSpan(
            original="businessman",
            suggested_replacement="businessperson",
            bias_type=BiasType.GENDER,
            severity=Severity.MEDIUM,
            start_char=26,
            end_char=37,
            penalty=0.15,
        ),
        DetectedSpan(
            original="manpower",
            suggested_replacement="workforce",
            bias_type=BiasType.GENDER,
            severity=Severity.MEDIUM,
            start_char=43,
            end_char=51,
            penalty=0.15,
        ),
    ]


@pytest.fixture
def mock_llm_client():
    client = MagicMock()
    client.complete = AsyncMock(return_value=MagicMock(
        text="They should be a strong business leader with a capable workforce.",
        model="gpt-4o",
        usage={"prompt_tokens": 50, "completion_tokens": 20},
    ))
    return client