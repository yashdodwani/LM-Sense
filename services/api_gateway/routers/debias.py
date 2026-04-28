"""
services/api_gateway/routers/debias.py — LM-Sense debias endpoint

Core debiasing endpoint.
"""
from fastapi import APIRouter, Depends
from services.debias_engine.engine import get_debias_engine
from services.audit_logger.worker import log_debias_result
from services.api_gateway.schemas.debias import DebiasRequest, DebiasResponse
from services.api_gateway.schemas.pipeline import PipelineConfig

router = APIRouter(prefix="/debias", tags=["Debias"])

@router.post("", response_model=DebiasResponse)
async def run_debias(body: DebiasRequest):
    engine = get_debias_engine()
    tenant_id = "test-tenant-123" # Hardcoded for now
    config = PipelineConfig(tenant_id=tenant_id)
    
    result = await engine.run(
        prompt=body.prompt,
        raw_response=body.raw_response,
        config=config,
        tenant_id=tenant_id,
        request_id="req-1234",
        model=body.model,
        requested_layers=body.layers,
    )

    from fastapi.encoders import jsonable_encoder
    
    # Audit log dispatched async — does not block the response
    log_debias_result.delay(jsonable_encoder(result), tenant_id, body.prompt)

    return result
