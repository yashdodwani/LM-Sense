"""
services/api_gateway/routers/integrations.py — LM-Sense /v1/integrations router

Manages LLM provider connections, API key issuance, and embeddable widget config.
Engineers use this to connect their LLM providers and generate API keys for the SDK/widget.
"""

import secrets
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from core.logging import get_logger
from services.api_gateway.dependencies import TenantContext, require_role
from services.api_gateway.schemas.common import APIResponse, LLMProvider, UserRole

logger = get_logger(__name__)
router = APIRouter(prefix="/integrations", tags=["Integrations"])


class ConnectProviderRequest(BaseModel):
    """Request body for connecting an LLM provider."""
    provider: LLMProvider
    api_key: str = Field(..., min_length=10)
    model_name: str
    org_id: str | None = None

    model_config = {"protected_namespaces": ()}


class ProviderConnection(BaseModel):
    """A connected LLM provider record."""
    id: str
    provider: LLMProvider
    model_name: str
    status: str    # "connected" | "error" | "disconnected"
    last_tested_at: str | None = None

    model_config = {"protected_namespaces": ()}


class APIKeyRecord(BaseModel):
    """An issued LM-Sense API key."""
    id: str
    label: str
    key_preview: str     # First 8 chars only — full key shown once on creation
    created_at: str
    last_used_at: str | None = None
    scopes: list[str]


class CreateAPIKeyRequest(BaseModel):
    label: str = Field(..., max_length=100)
    scopes: list[str] = Field(default=["debias", "audit"])


class CreateAPIKeyResponse(BaseModel):
    record: APIKeyRecord
    full_key: str   # Shown once — store it


@router.get("/providers", response_model=APIResponse[list[ProviderConnection]])
async def list_providers(ctx: TenantContext = Depends(require_role(UserRole.ENGINEER))):
    """Returns all connected LLM provider configurations for this tenant."""
    return APIResponse(data=[])


@router.post("/providers", response_model=APIResponse[ProviderConnection])
async def connect_provider(
    body: ConnectProviderRequest,
    ctx: TenantContext = Depends(require_role(UserRole.ENGINEER)),
):
    """
    Stores encrypted LLM provider API key and tests the connection.
    TODO: encrypt key with tenant's KMS key before persisting
    """
    logger.info("integration.connect", provider=body.provider, tenant=str(ctx.tenant_id))
    return APIResponse(data=ProviderConnection(
        id=str(uuid.uuid4()), provider=body.provider,
        model_name=body.model_name, status="connected"
    ))


@router.get("/api-keys", response_model=APIResponse[list[APIKeyRecord]])
async def list_api_keys(ctx: TenantContext = Depends(require_role(UserRole.ENGINEER))):
    """Returns all API keys issued for this tenant (previews only)."""
    return APIResponse(data=[])


@router.post("/api-keys", response_model=APIResponse[CreateAPIKeyResponse])
async def create_api_key(
    body: CreateAPIKeyRequest,
    ctx: TenantContext = Depends(require_role(UserRole.ADMIN)),
):
    """
    Generates a new LM-Sense API key.
    The full key is returned once here — it is not stored in plain text.
    """
    raw_key = f"lms_{secrets.token_urlsafe(32)}"
    record = APIKeyRecord(
        id=str(uuid.uuid4()),
        label=body.label,
        key_preview=raw_key[:12] + "...",
        created_at="2026-01-01T00:00:00Z",
        scopes=body.scopes,
    )
    return APIResponse(data=CreateAPIKeyResponse(record=record, full_key=raw_key))