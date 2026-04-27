"""
services/api_gateway/middleware/rate_limiter.py — LM-Sense per-tenant rate limiter

Implements a Redis sliding window rate limiter.
Keyed per tenant_id so each enterprise account has its own quota.
Inject as a FastAPI dependency on any route that should be rate-limited.
"""

import time

import redis.asyncio as aioredis
from fastapi import Depends, Request

from core.config import settings
from core.exceptions import RateLimitExceededError
from core.logging import get_logger
from services.api_gateway.middleware.auth import get_tenant_context
from services.api_gateway.schemas.common import TenantContext

logger = get_logger(__name__)

_redis_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    """Returns the shared async Redis client. Created on first call."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
    return _redis_client


async def rate_limit(
    request: Request,
    ctx: TenantContext = Depends(get_tenant_context),
    redis: aioredis.Redis = Depends(get_redis),
) -> None:
    """
    FastAPI dependency — enforces per-tenant sliding window rate limit.
    Window: 60 seconds. Limit: settings.MAX_REQUESTS_PER_MINUTE.

    Inject on any route:
        @router.post("/debias", dependencies=[Depends(rate_limit)])
    """
    tenant_key = f"ratelimit:{ctx.tenant_id}"
    now = time.time()
    window_start = now - 60.0

    pipe = redis.pipeline()
    # Remove entries outside the 60s window
    pipe.zremrangebyscore(tenant_key, 0, window_start)
    # Count remaining entries in window
    pipe.zcard(tenant_key)
    # Add current request
    pipe.zadd(tenant_key, {str(now): now})
    # Set key TTL to 65s (a bit beyond the window)
    pipe.expire(tenant_key, 65)
    results = await pipe.execute()

    current_count: int = results[1]

    logger.debug(
        "rate_limit.check",
        tenant_id=str(ctx.tenant_id),
        count=current_count,
        limit=settings.MAX_REQUESTS_PER_MINUTE,
    )

    if current_count >= settings.MAX_REQUESTS_PER_MINUTE:
        raise RateLimitExceededError(
            f"Rate limit exceeded: {settings.MAX_REQUESTS_PER_MINUTE} requests/minute",
            detail=f"Current count: {current_count}. Try again in a few seconds.",
        )