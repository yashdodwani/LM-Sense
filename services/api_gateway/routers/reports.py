"""
services/api_gateway/routers/reports.py — LM-Sense /v1/reports router

Compliance report generation endpoints.
Triggers async Celery jobs that build PDF/CSV reports from audit logs.
Enterprise clients use these reports for regulatory submissions and internal audits.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.logging import get_logger
from services.api_gateway.dependencies import TenantContext, require_role
from services.api_gateway.schemas.common import APIResponse, UserRole

logger = get_logger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    """Request body for POST /v1/reports."""
    format: str = "pdf"             # "pdf" | "csv" | "json"
    from_date: str | None = None    # ISO 8601
    to_date: str | None = None
    title: str | None = None        # Custom title for the report cover page


class ReportJob(BaseModel):
    """Async report generation job."""
    job_id: str
    status: str         # "queued" | "processing" | "done" | "failed"
    download_url: str | None = None
    expires_at: str | None = None


@router.post(
    "",
    response_model=APIResponse[ReportJob],
    summary="Generate a compliance report",
    description="Queues an async PDF/CSV report generation job. Poll /v1/reports/{job_id} for status.",
)
async def create_report(
    body: ReportRequest,
    ctx: TenantContext = Depends(require_role(UserRole.ANALYST)),
) -> APIResponse[ReportJob]:
    """
    Dispatches a Celery task to the report_generator service.
    TODO: from services.report_generator.worker import generate_report_task
          task = generate_report_task.delay(str(ctx.tenant_id), body.dict())
    """
    job_id = str(uuid.uuid4())
    logger.info("reports.queued", job_id=job_id, format=body.format, tenant=str(ctx.tenant_id))
    return APIResponse(data=ReportJob(job_id=job_id, status="queued"))


@router.get(
    "/{job_id}",
    response_model=APIResponse[ReportJob],
    summary="Poll report job status",
)
async def get_report_status(
    job_id: str,
    ctx: TenantContext = Depends(require_role(UserRole.ANALYST)),
) -> APIResponse[ReportJob]:
    """
    Returns the status of a report generation job.
    When status == 'done', download_url is populated with a pre-signed S3 URL.
    TODO: fetch Celery task result by job_id
    """
    return APIResponse(data=ReportJob(job_id=job_id, status="queued"))