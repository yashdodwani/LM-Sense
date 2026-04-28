"""
services/api_gateway/schemas/audit.py — LM-Sense audit endpoint schemas

Pydantic models for GET/POST /v1/audit.
Every debiased response is persisted as an AuditEntry — this is what
enterprise clients export for compliance and regulatory review.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from services.api_gateway.schemas.common import BiasScore, BiasType, LayerName, Severity


class AuditEntry(BaseModel):
    """A single audit log record."""
    id: UUID
    tenant_id: UUID
    request_id: str
    model: str
    prompt_hash: str              # SHA-256 of original prompt (not stored in plain text)
    raw_response_hash: str        # SHA-256 of raw LLM response
    debiased_response: str
    bias_score_before: BiasScore
    bias_score_after: BiasScore
    bias_types_detected: list[BiasType]
    severity: Severity
    layers_applied: list[LayerName]
    action_taken: str
    block_hash: str               # Hash chain block — links to previous entry
    created_at: datetime


class AuditQuery(BaseModel):
    """Query filters for GET /v1/audit."""
    bias_type: BiasType | None = None
    severity: Severity | None = None
    model: str | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


class AuditListResponse(BaseModel):
    """Paginated list of audit entries."""
    entries: list[AuditEntry]
    total: int
    page: int
    page_size: int
    pages: int


class AuditExportRequest(BaseModel):
    """Request body for triggering a compliance report export."""
    format: str = Field(default="pdf", pattern="^(pdf|csv|json)$")
    from_date: datetime | None = None
    to_date: datetime | None = None
    bias_types: list[BiasType] | None = None