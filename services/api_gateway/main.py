"""
services/api_gateway/main.py — LM-Sense API Gateway entry point

FastAPI application initialisation, middleware registration, lifespan hooks,
and router mounting. This is what uvicorn runs.

Start with:
    uvicorn services.api_gateway.main:app --reload --port 8000
"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.exceptions import LMSenseError
from core.llm_client import get_llm_client
from core.logging import configure_logging, get_logger
from services.api_gateway.routers import audit, debias, integrations, pipeline, reports, sandbox
from services.api_gateway.schemas.common import ErrorResponse

logger = get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on startup (before yield) and shutdown (after yield).
    Use for: DB pool warmup, loading ML models, closing clients.
    """
    configure_logging()
    logger.info("lm_sense.startup", env=settings.APP_ENV, version=settings.APP_VERSION)

    # Validate LLM client is reachable
    _ = get_llm_client()

    yield

    # Shutdown
    await get_llm_client().close()
    logger.info("lm_sense.shutdown")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="LM-Sense API",
    description=(
        "Bias mitigation as a layer — not a replacement. "
        "Drop LM-Sense over any LLM to detect, debias, and audit outputs in real time."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Injects a unique X-Request-ID into every request and response."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Logs method, path, status, and duration for every request."""
    import time
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000, 2)
    logger.info(
        "http.request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
        request_id=getattr(request.state, "request_id", None),
    )
    return response


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(LMSenseError)
async def lmsense_error_handler(request: Request, exc: LMSenseError) -> JSONResponse:
    """Converts all domain exceptions into a standard ErrorResponse envelope."""
    logger.warning(
        "lmsense.error",
        error_code=exc.error_code,
        message=exc.message,
        path=request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error_code=exc.error_code,
            message=exc.message,
            detail=exc.detail,
            request_id=getattr(request.state, "request_id", None),
        ).model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches any unhandled exception — logs it and returns a generic 500."""
    logger.exception("unhandled.error", path=request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            request_id=getattr(request.state, "request_id", None),
        ).model_dump(mode="json"),
    )


# ── Routers ───────────────────────────────────────────────────────────────────

API_PREFIX = "/v1"

app.include_router(debias.router,       prefix=API_PREFIX)
app.include_router(sandbox.router,      prefix=API_PREFIX)
app.include_router(audit.router,        prefix=API_PREFIX)
app.include_router(pipeline.router,     prefix=API_PREFIX)
app.include_router(integrations.router, prefix=API_PREFIX)
app.include_router(reports.router,      prefix=API_PREFIX)


# ── Health probes (no auth) ───────────────────────────────────────────────────

@app.get("/health", tags=["Infra"], include_in_schema=False)
async def health() -> dict:
    """Kubernetes liveness probe — always returns 200 if app is running."""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/ready", tags=["Infra"], include_in_schema=False)
async def ready() -> dict:
    """
    Kubernetes readiness probe — checks DB and Redis connectivity.
    TODO: add real DB ping and Redis ping
    """
    return {"status": "ready", "version": settings.APP_VERSION}