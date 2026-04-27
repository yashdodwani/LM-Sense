"""
services/api_gateway/schemas/common.py — LM-Sense shared enums and base types

Defines all shared Pydantic models, enums, and response wrappers used
across every router. Import from here — never redefine enums per-router.
"""

from datetime import datetime
from enum import StrEnum
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

T = TypeVar("T")


# ── Enums ─────────────────────────────────────────────────────────────────────

class BiasType(StrEnum):
    GENDER        = "gender"
    RACIAL        = "racial"
    AGE           = "age"
    GEOGRAPHIC    = "geographic"
    SOCIOECONOMIC = "socioeconomic"
    UNKNOWN       = "unknown"


class Severity(StrEnum):
    HIGH   = "high"
    MEDIUM = "medium"
    LOW    = "low"
    NONE   = "none"


class LayerName(StrEnum):
    QLORA_CDA    = "qlora_cda"      # Layer 1 — training-time
    RLDF         = "rldf"           # Layer 2 — alignment
    POSTPROCESS  = "postprocess"    # Layer 3 — inference-time


class ActionOnDetection(StrEnum):
    REWRITE  = "rewrite"    # Automatically rewrite the biased spans
    FLAG     = "flag"       # Pass through but mark as flagged
    BLOCK    = "block"      # Block output entirely and return explanation


class UserRole(StrEnum):
    ADMIN    = "admin"
    ENGINEER = "engineer"
    ANALYST  = "analyst"
    VIEWER   = "viewer"


class LLMProvider(StrEnum):
    OPENAI    = "openai"
    ANTHROPIC = "anthropic"
    GEMINI    = "gemini"
    CUSTOM    = "custom"


# ── Response wrappers ─────────────────────────────────────────────────────────

class APIResponse(BaseModel, Generic[T]):
    """Standard envelope for all LM-Sense API responses."""
    success: bool = True
    data: T
    request_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard envelope for all LM-Sense error responses."""
    success: bool = False
    error_code: str
    message: str
    detail: str | None = None
    request_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Shared sub-models ─────────────────────────────────────────────────────────

class BiasScore(BaseModel):
    """Per-response bias scoring result."""
    overall: float = Field(..., ge=0.0, le=100.0, description="0 = maximally biased, 100 = perfectly fair")
    gender: float = Field(default=100.0, ge=0.0, le=100.0)
    racial: float = Field(default=100.0, ge=0.0, le=100.0)
    age: float = Field(default=100.0, ge=0.0, le=100.0)
    geographic: float = Field(default=100.0, ge=0.0, le=100.0)
    socioeconomic: float = Field(default=100.0, ge=0.0, le=100.0)


class LayerTrace(BaseModel):
    """Records what one debiasing layer did to an output."""
    layer: LayerName
    triggered: bool
    changes_made: int = Field(description="Number of spans rewritten")
    score_before: float
    score_after: float
    duration_ms: float
    notes: str | None = None


class TenantContext(BaseModel):
    """Extracted from JWT — attached to every request by auth middleware."""
    tenant_id: UUID
    user_id: UUID
    role: UserRole
    email: str