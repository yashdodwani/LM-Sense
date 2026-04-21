"""
FastAPI application entry point.
Assembles routes, middleware, and lifespan events for the API Gateway.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import debias, audit, sandbox, pipeline, integrations, reports
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for API Gateway."""
    # Start up
    yield
    # Shut down
app = FastAPI(title="LM-Sense API Gateway", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(debias.router, prefix="/v1")
app.include_router(audit.router, prefix="/v1")
app.include_router(sandbox.router, prefix="/v1")
app.include_router(pipeline.router, prefix="/v1")
app.include_router(integrations.router, prefix="/v1")
app.include_router(reports.router, prefix="/v1")
@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
@app.get("/ready")
async def ready_check() -> dict[str, str]:
    return {"status": "ready"}
