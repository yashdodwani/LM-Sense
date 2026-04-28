"""
services/api_gateway/routers/debias.py — LM-Sense debias endpoint

Core debiasing endpoint.
"""
from fastapi import APIRouter, Depends
from services.debias_engine.engine import get_debias_engine
from services.audit_logger.worker import log_debias_result
from services.api_gateway.schemas.debias import DebiasRequest, DebiasResponse
from services.api_gateway.schemas.pipeline import PipelineConfig

router = APIRouter(prefix="/v1/debias", tags=["Debias"])

@router.post("/", response_model=DebiasResponse)
async def run_debias(body: DebiasRequest):
    engine = get_debias_engine()
    tenant_id = "test-tenant-123" # Hardcoded for now
    config = PipelineConfig()
    
    result = await engine.run(
        prompt=body.prompt,
        raw_response=body.raw_response,
        config=config,
        tenant_id=tenant_id,
        request_id="req-1234",
        model=body.model,
        requested_layers=body.layers,
    )

    # Convert DebiasResult to dict for Celery
    result_dict = {
        "request_id": result.request_id,
        "model": result.model,
        "raw_response": result.raw_response,
        "debiased_response": result.debiased_response,
        "action_taken": result.action_taken,
        "bias_score_before": result.bias_score_before.model_dump() if hasattr(result.bias_score_before, 'model_dump') else result.bias_score_before,
        "bias_score_after": result.bias_score_after.model_dump() if hasattr(result.bias_score_after, 'model_dump') else result.bias_score_after,
        "flagged_spans": [s.model_dump() if hasattr(s, 'model_dump') else s for s in result.flagged_spans],
        "layer_trace": [t.model_dump() if hasattr(t, 'model_dump') else t for t in result.layer_trace],
        "layers_applied": [str(l.value) if hasattr(l, 'value') else l for l in result.layers_applied],
        "processing_time_ms": result.processing_time_ms
    }

    # Audit log dispatched async — does not block the response
    log_debias_result.delay(result_dict, tenant_id, body.prompt)

    return result
