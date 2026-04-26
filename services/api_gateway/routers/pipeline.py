"""
services/api_gateway/routers/pipeline.py — LM-Sense GET/PUT /v1/pipeline router

Pipeline configuration endpoints — lets engineers read and update the
debiasing layer settings (QLoRA, RLDF, post-processing) per tenant.
Decision-makers use the simplified preset field instead of raw layer config.
"""

from fastapi import APIRouter, Depends

from core.logging import get_logger
from services.api_gateway.dependencies import TenantContext, require_role
from services.api_gateway.schemas.common import APIResponse, UserRole
from services.api_gateway.schemas.pipeline import PipelineConfig

logger = get_logger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.get(
    "",
    response_model=APIResponse[PipelineConfig],
    summary="Get pipeline configuration",
    description="Returns the current debiasing pipeline configuration for this tenant.",
)
async def get_pipeline_config(
    ctx: TenantContext = Depends(require_role(UserRole.ANALYST)),
) -> APIResponse[PipelineConfig]:
    """
    Fetches tenant's PipelineConfig from the database.
    Returns defaults if no config has been saved yet.
    TODO: wire to DB read
    """
    logger.info("pipeline.get", tenant_id=str(ctx.tenant_id))
    return APIResponse(data=PipelineConfig(tenant_id=str(ctx.tenant_id)))


@router.put(
    "",
    response_model=APIResponse[PipelineConfig],
    summary="Update pipeline configuration",
    description="Saves a new pipeline configuration. Engineers and above only.",
)
async def update_pipeline_config(
    body: PipelineConfig,
    ctx: TenantContext = Depends(require_role(UserRole.ENGINEER)),
) -> APIResponse[PipelineConfig]:
    """
    Persists updated PipelineConfig to the database.
    Immediately takes effect on the next /v1/debias call for this tenant.
    TODO: wire to DB upsert + invalidate cache
    """
    logger.info("pipeline.update", tenant_id=str(ctx.tenant_id), preset=body.preset)
    body.tenant_id = str(ctx.tenant_id)
    return APIResponse(data=body)