"""
services/api_gateway/middleware/auth.py — LM-Sense JWT authentication and RBAC

FastAPI dependency that validates the Bearer JWT on every protected route.
Extracts tenant_id, user_id, and role — injects TenantContext into request state.
Role-based access control is enforced via the `require_role` dependency factory.
"""

from uuid import UUID

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from core.exceptions import AuthenticationError, AuthorizationError
from core.logging import get_logger
from services.api_gateway.schemas.common import TenantContext, UserRole

logger = get_logger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

# Role hierarchy — each role inherits permissions of roles below it
ROLE_HIERARCHY: dict[UserRole, int] = {
    UserRole.VIEWER:   1,
    UserRole.ANALYST:  2,
    UserRole.ENGINEER: 3,
    UserRole.ADMIN:    4,
}


async def get_tenant_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> TenantContext:
    """
    FastAPI dependency — validates JWT and returns TenantContext.
    Inject this into any route that requires authentication.

    Usage:
        @router.post("/")
        async def my_route(ctx: TenantContext = Depends(get_tenant_context)):
            ...
    """
    if credentials is None:
        raise AuthenticationError("Missing Authorization header")

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid token", detail=str(exc))

    try:
        ctx = TenantContext(
            tenant_id=UUID(payload["tenant_id"]),
            user_id=UUID(payload["sub"]),
            role=UserRole(payload["role"]),
            email=payload["email"],
        )
    except (KeyError, ValueError) as exc:
        raise AuthenticationError("Token payload is malformed", detail=str(exc))

    # Attach to request state so middleware can log it
    request.state.tenant_context = ctx
    logger.debug("auth.ok", user_id=str(ctx.user_id), role=ctx.role)
    return ctx


def require_role(minimum_role: UserRole):
    """
    Dependency factory for role-based access control.
    Raises AuthorizationError if the authenticated user's role is insufficient.

    Usage:
        @router.put("/pipeline")
        async def update_pipeline(
            ctx: TenantContext = Depends(require_role(UserRole.ENGINEER))
        ):
            ...
    """
    async def _check_role(
        ctx: TenantContext = Depends(get_tenant_context),
    ) -> TenantContext:
        user_level = ROLE_HIERARCHY.get(ctx.role, 0)
        required_level = ROLE_HIERARCHY.get(minimum_role, 999)
        if user_level < required_level:
            raise AuthorizationError(
                f"Role '{ctx.role}' is insufficient. Requires '{minimum_role}' or above."
            )
        return ctx

    return _check_role