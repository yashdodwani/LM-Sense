"""
services/api_gateway/routers/sandbox.py — LM-Sense POST /v1/sandbox router

Prompt sandbox endpoint — used by the web dashboard's split-pane test view.
Sends a prompt to the chosen LLM, gets the raw response, runs it through
all debiasing layers, and returns raw + debiased side-by-side for comparison.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from core.llm_client import get_llm_client
from core.logging import get_logger
from services.api_gateway.dependencies import TenantContext, get_tenant_context, rate_limit
from services.api_gateway.schemas.common import APIResponse, BiasScore
from services.api_gateway.schemas.debias import DebiasResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/sandbox", tags=["Sandbox"])


class SandboxRequest(BaseModel):
    """Request body for POST /v1/sandbox."""
    model: str = Field(..., examples=["gpt-4o", "claude-sonnet-4-20250514"])
    prompt: str = Field(..., max_length=16_000)
    layers: list[str] | None = None


class SandboxResponse(BaseModel):
    """Side-by-side comparison result from the sandbox."""
    request_id: str
    model: str
    prompt: str
    raw_response: str
    debiased_response: str
    bias_score_raw: BiasScore
    bias_score_debiased: BiasScore
    diff_tokens: list[dict]    # [{token, status: "added"|"removed"|"unchanged"}]
    layer_trace: list[dict]
    processing_time_ms: float


@router.post(
    "",
    response_model=APIResponse[SandboxResponse],
    summary="Test a prompt in the sandbox",
    description="Sends a prompt to the selected LLM, then debiases the response. Returns both for comparison.",
    dependencies=[Depends(rate_limit)],
)
async def sandbox_test(
    body: SandboxRequest,
    ctx: TenantContext = Depends(get_tenant_context),
) -> APIResponse[SandboxResponse]:
    """
    1. Call the LLM with body.prompt
    2. Score the raw response
    3. Debias through configured layers
    4. Score the debiased response
    5. Compute token-level diff
    6. Return side-by-side comparison
    """
    request_id = str(uuid.uuid4())
    llm = get_llm_client()

    # TODO: wire to real LLM call + debiasing engine
    # llm_response = await llm.complete(model=body.model, prompt=body.prompt)
    # debias result = await engine.run(...)

    logger.info("sandbox.test", request_id=request_id, model=body.model)

    return APIResponse(
        data=SandboxResponse(
            request_id=request_id,
            model=body.model,
            prompt=body.prompt,
            raw_response="[Raw LLM response — engine not yet wired]",
            debiased_response="[Debiased response — engine not yet wired]",
            bias_score_raw=BiasScore(overall=0.0),
            bias_score_debiased=BiasScore(overall=0.0),
            diff_tokens=[],
            layer_trace=[],
            processing_time_ms=0.0,
        ),
        request_id=request_id,
    )