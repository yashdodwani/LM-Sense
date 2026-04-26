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
    TODO: wire to AuditLogger.query()
    """
    logger.info("audit.list", tenant_id=str(ctx.tenant_id), page=page)

    return APIResponse(
        data=AuditListResponse(entries=[], total=0, page=page, page_size=page_size, pages=0)
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
    TODO: dispatch to report_generator Celery task
    """
    job_id = str(uuid.uuid4())
    logger.info("audit.export.queued", job_id=job_id, format=body.format)

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
    TODO: wire to AuditLogger
    """
    return APIResponse(data={"intact": True, "entries_checked": 0, "first_tampered_id": None})