"""
services/api_gateway/schemas/debias.py — LM-Sense debias endpoint schemas

Pydantic models for POST /v1/debias — the core debiasing endpoint.
DebiasRequest is what clients send. DebiasResponse is what they get back.
"""

from pydantic import BaseModel, Field

from services.api_gateway.schemas.common import (
    BiasScore, BiasType, LayerName, LayerTrace, Severity
)


class DebiasRequest(BaseModel):
    """
    Request body for POST /v1/debias.
    Pass the raw LLM response and we'll debias it through the configured layers.
    """
    model: str = Field(
        ...,
        examples=["gpt-4o", "claude-sonnet-4-20250514", "gemini-1.5-pro"],
        description="The LLM model that produced raw_response",
    )
    prompt: str = Field(
        ...,
        max_length=32_000,
        description="The original prompt sent to the LLM",
    )
    raw_response: str = Field(
        ...,
        max_length=32_000,
        description="The raw LLM output to be debiased",
    )
    layers: list[LayerName] | None = Field(
        default=None,
        description="Which layers to apply. Defaults to all enabled layers in pipeline config.",
        examples=[["postprocess"], ["qlora_cda", "rldf", "postprocess"]],
    )
    context: dict | None = Field(
        default=None,
        description="Optional domain context (e.g. {'domain': 'hiring'}) to tune detection",
    )


class FlaggedSpan(BaseModel):
    """A specific span within the response that was flagged or rewritten."""
    original: str
    replacement: str | None = None       # None if action was BLOCK or FLAG only
    bias_type: BiasType
    severity: Severity
    start_char: int
    end_char: int


class DebiasResponse(BaseModel):
    """
    Response from POST /v1/debias.
    Contains the debiased text, scores, layer traces, and flagged spans.
    """
    request_id: str
    model: str
    raw_response: str
    debiased_response: str
    action_taken: str                    # "rewritten" | "flagged" | "blocked" | "clean"

    bias_score_before: BiasScore
    bias_score_after: BiasScore

    flagged_spans: list[FlaggedSpan] = Field(default_factory=list)
    layer_trace: list[LayerTrace] = Field(default_factory=list)

    processing_time_ms: float
    layers_applied: list[LayerName]