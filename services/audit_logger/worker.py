"""
services/audit_logger/worker.py — Celery worker for audit log

Processes log writing asynchronously to unblock the API responses.
"""
from celery import Celery
import asyncio
from core.config import settings
from core.logging import get_logger
from services.audit_logger.logger import AuditLogger
from services.audit_logger.exporter import AuditExporter
from services.api_gateway.schemas.audit import AuditQuery
import base64

logger = get_logger(__name__)

redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("lm-sense", broker=redis_url)

@celery_app.task(name="log_debias_result", bind=True, max_retries=3)
def log_debias_result(self, result_dict: dict, tenant_id: str, prompt: str):
    """
    Celery task to persist debias results.
    Deserialises dict and logs via AuditLogger.
    """
    async def run_log():
        logger.info("audit_logger.task.start", tenant_id=tenant_id)
        al = AuditLogger()
        entry_id = await al.log(result_dict, tenant_id, prompt)
        logger.info("audit_logger.task.success", tenant_id=tenant_id, entry_id=entry_id)

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(run_log())
        else:
            loop.run_until_complete(run_log())
    except Exception as exc:
        logger.error("audit_logger.task.error", error=str(exc))
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(name="export_audit_log_task", bind=True)
def export_audit_log_task(self, tenant_id: str, job_id: str, format: str):
    """Generates an audit report async."""
    async def run_export():
        al = AuditLogger()
        dummy_query = AuditQuery(page_size=1000)
        entries, _ = await al.query(tenant_id, dummy_query)
        exporter = AuditExporter()
        if format == "pdf":
            await exporter.export_pdf(tenant_id, entries, "Audit Log")
        elif format == "csv":
            await exporter.export_csv(entries)
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(run_export())
        else:
            loop.run_until_complete(run_export())
    except Exception as exc:
        logger.error("audit_export.task.error", error=str(exc))
