"""
services/api_gateway/routers/audit.py — LM-Sense GET/POST /v1/audit router

Audit log endpoints — lets enterprise clients retrieve, filter, and export
the tamper-evident log of all debiased responses for compliance review.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from core.logging import get_logger
from services.api_gateway.dependencies import TenantContext, get_tenant_context, require_role
from services.api_gateway.schemas.audit import AuditExportRequest, AuditListResponse, AuditQuery
from services.api_gateway.schemas.common import APIResponse, BiasType, Severity, UserRole
from services.audit_logger.logger import AuditLogger
from services.audit_logger.worker import export_audit_log_task
from services.api_gateway.schemas.audit import AuditEntry

logger = get_logger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit"])


class ExportJobResponse(BaseModel):
    """Async export job — poll /v1/audit/export/{job_id} for status."""
    job_id: str
    format: str
    status: str = "queued"


@router.get(
    "",
    response_model=APIResponse[AuditListResponse],
    summary="List audit log entries",
    description="Returns paginated audit log entries for the authenticated tenant.",
)
async def list_audit_entries(
    bias_type: BiasType | None = Query(default=None),
    severity: Severity | None = Query(default=None),
    model: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    ctx: TenantContext = Depends(get_tenant_context),
) -> APIResponse[AuditListResponse]:
    """
    Fetch audit entries filtered by bias_type, severity, model, and date range.
    Sorted by created_at descending (newest first).
    """
    logger.info("audit.list", tenant_id=str(ctx.tenant_id), page=page)
    
    query = AuditQuery(
        bias_type=bias_type,
        severity=severity,
        model=model,
        page=page,
        page_size=page_size
    )
    
    logger_svc = AuditLogger()
    entries, total = await logger_svc.query(str(ctx.tenant_id), query)
    
    formatted_entries = []
    for e in entries:
        formatted_entries.append(AuditEntry(
            id=e.id,
            tenant_id=e.tenant_id,
            request_id=e.request_id,
            model=e.model,
            prompt_hash=e.prompt_hash,
            raw_response_hash=e.raw_response_hash,
            debiased_response=e.debiased_response,
            bias_score_before=e.bias_score_before,
            bias_score_after=e.bias_score_after,
            bias_types_detected=e.bias_types_detected,
            severity=e.severity,
            layers_applied=e.layers_applied,
            action_taken=e.action_taken,
            block_hash=e.block_hash,
            created_at=e.created_at
        ))

    pages = (total + page_size - 1) // page_size

    return APIResponse(
        data=AuditListResponse(
            entries=formatted_entries,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
    )


@router.post(
    "/export",
    response_model=APIResponse[ExportJobResponse],
    summary="Export audit log as PDF or CSV",
    description="Queues an async export job. Returns a job_id to poll for the download URL.",
)
async def export_audit_log(
    body: AuditExportRequest,
    ctx: TenantContext = Depends(require_role(UserRole.ANALYST)),
) -> APIResponse[ExportJobResponse]:
    """
    Triggers a Celery task to generate and upload the compliance report.
    """
    job_id = str(uuid.uuid4())
    logger.info("audit.export.queued", job_id=job_id, format=body.format)

    export_audit_log_task.delay(str(ctx.tenant_id), job_id, body.format)

    return APIResponse(
        data=ExportJobResponse(job_id=job_id, format=body.format, status="queued")
    )


@router.get(
    "/verify",
    summary="Verify audit chain integrity",
    description="Recomputes the SHA-256 hash chain and confirms no tampering has occurred.",
)
async def verify_chain(
    ctx: TenantContext = Depends(require_role(UserRole.ADMIN)),
) -> APIResponse[dict]:
    """
    Calls AuditLogger.verify_chain() for this tenant.
    Returns {intact: bool, entries_checked: int, first_tampered_id: str | None}
    """
    logger_svc = AuditLogger()
    result = await logger_svc.verify_chain(str(ctx.tenant_id))
    return APIResponse(data=result)
