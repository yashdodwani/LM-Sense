import os
import json
base_dir = "/home/voyager4/projects/LM-Sense"
files = {
    "core/config.py": '''"""
Configuration management for LM-Sense.
Loads environment variables and sets defaults for the entire system using pydantic-settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
class Settings(BaseSettings):
    """Global application settings."""
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    # LLM Providers
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    # Infrastructure
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/db"
    REDIS_URL: str = "redis://localhost:6379/0"
    # Engine configs
    REWARD_MODEL: str = "gpt-4o"
    FAIRNESS_LAMBDA: float = 0.7
    BIAS_THRESHOLD: float = 0.6
    LAYER1_ENABLED: bool = True
    LAYER2_ENABLED: bool = True
    LAYER3_ENABLED: bool = True
    # Rate limiting
    MAX_REQUESTS_PER_MINUTE: int = 60
settings = Settings()
''',
    "core/logging.py": '''"""
Structured logging setup.
Configures structlog to output JSON logs for OpenTelemetry compatibility.
"""
import structlog
def setup_logging() -> None:
    """Initializes structlog configuration for the application."""
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
def get_logger(name: str) -> structlog.BoundLogger:
    """Returns a bound logger instance."""
    return structlog.get_logger(name)
''',
    "core/exceptions.py": '''"""
Custom domain exceptions for LM-Sense.
"""
class LMSenseError(Exception):
    """Base exception for LM-Sense."""
    pass
class BiasDetectionError(LMSenseError):
    """Raised when bias cannot be properly scored."""
    pass
class LayerTimeoutError(LMSenseError):
    """Raised when a debias layer times out."""
    pass
''',
    "core/llm_client.py": '''"""
Unified LLM Client wrapper.
Abstracts interactions with OpenAI, Anthropic, and Gemini.
"""
from typing import Optional
class LLMClient:
    """Client for routing requests to different LLM providers asynchronously."""
    async def generate(self, prompt: str, model: str = "gpt-4o", temperature: float = 0.7) -> str:
        """Generates text from the underlying provider."""
        raise NotImplementedError("Generation not implemented")
''',
    "core/cache.py": '''"""
Redis caching utility.
Manages key-value storage with TTLs and tenant namespaces.
"""
from typing import Optional, Any
class RedisCache:
    """Async wrapper around Redis operations."""
    async def get(self, key: str, tenant_id: str) -> Optional[Any]:
        """Gets a value from cache."""
        raise NotImplementedError
    async def set(self, key: str, value: Any, tenant_id: str, ttl: int = 3600) -> None:
        """Sets a value in cache."""
        raise NotImplementedError
''',
    "db/session.py": '''"""
SQLAlchemy database setup.
Provides async session factories for database interaction.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
async def get_db_session() -> AsyncSession: # type: ignore
    """Dependency for providing a database session."""
    async with AsyncSessionLocal() as session:
        yield session
''',
    "db/base.py": '''"""
SQLAlchemy declarative base and mixins.
"""
from sqlalchemy.orm import declarative_base
Base = declarative_base()
class TimestampMixin:
    """Mixin for created_at and updated_at."""
    pass
class UUIDMixin:
    """Mixin for UUID primary keys."""
    pass
''',
    "db/migrations/env.py": '''"""
Alembic migration environment configuration.
"""
# Alembic config goes here
''',
    "services/api_gateway/main.py": '''"""
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
''',
    "services/api_gateway/dependencies.py": '''"""
FastAPI Dependencies.
Contains functions for auth checks, rate-limits, and db sessions.
"""
from fastapi import Request
async def verify_auth(request: Request) -> str:
    """Validates JWT and returns tenant ID."""
    raise NotImplementedError
''',
    "services/api_gateway/routers/debias.py": '''"""
Debias router.
Endpoint for primary debiasing requests.
"""
from fastapi import APIRouter
from ..schemas.debias import DebiasRequest, DebiasResponse
router = APIRouter(tags=["Debias"])
@router.post("/debias", response_model=DebiasResponse)
async def run_debias(request: DebiasRequest) -> DebiasResponse:
    """Processes raw output through the debias engine."""
    raise NotImplementedError
''',
    "services/api_gateway/routers/audit.py": '''"""
Audit router.
Endpoints for viewing and generating audit logs.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Audit"])
@router.get("/audit")
async def get_audit_logs():
    raise NotImplementedError
''',
    "services/api_gateway/routers/sandbox.py": '''"""
Sandbox router.
Endpoints for testing prompts and getting A/B comparisons.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Sandbox"])
@router.post("/sandbox")
async def run_sandbox():
    raise NotImplementedError
''',
    "services/api_gateway/routers/pipeline.py": '''"""
Pipeline Config router.
Endpoints to configure layer settings per tenant.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Pipeline"])
@router.get("/pipeline")
async def get_pipeline_config():
    raise NotImplementedError
''',
    "services/api_gateway/routers/integrations.py": '''"""
Integrations router.
Manage LLM provider settings.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Integrations"])
''',
    "services/api_gateway/routers/reports.py": '''"""
Reports router.
Trigger compliance report creation.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Reports"])
''',
    "services/api_gateway/middleware/auth.py": '''"""
Auth Middleware.
Intercepts requests to enforce RBAC.
"""
''',
    "services/api_gateway/middleware/rate_limiter.py": '''"""
Rate Limiting Middleware.
Uses Redis sliding window rate limits.
"""
''',
    "services/api_gateway/schemas/common.py": '''"""
Shared Enums and Pydantic types.
"""
from enum import Enum
class BiasType(str, Enum):
    GENDER = "gender"
    RACIAL = "racial"
    AGE = "age"
    GEOGRAPHIC = "geographic"
    SOCIOECONOMIC = "socioeconomic"
''',
    "services/api_gateway/schemas/debias.py": '''"""
Debias API Models.
"""
from pydantic import BaseModel
from typing import List, Optional
class LayerTrace(BaseModel):
    layer_name: str
    applied: bool
class DebiasRequest(BaseModel):
    model: str
    prompt: str
    raw_response: str
    layers: Optional[List[str]] = None
class DebiasResponse(BaseModel):
    debiased_response: str
    bias_score: float
    layer_trace: List[LayerTrace]
''',
    "services/api_gateway/schemas/audit.py": '''"""Audit API Models."""
from pydantic import BaseModel
''',
    "services/api_gateway/schemas/pipeline.py": '''"""Pipeline API Models."""
from pydantic import BaseModel
class PipelineConfig(BaseModel):
    pass
''',
    "services/debias_engine/engine.py": '''"""
Debias Engine orchestration.
Runs inputs through configured layers.
"""
from services.api_gateway.schemas.pipeline import PipelineConfig
from .result import DebiasResult
class DebiasEngine:
    """Main debiasing pipeline orchestrator."""
    async def run(
        self,
        prompt: str,
        raw_response: str,
        config: PipelineConfig,
        tenant_id: str,
    ) -> DebiasResult:
        """
        Runs the raw_response through enabled layers in sequence.
        Layer 1 → Layer 2 → Layer 3 (each layer receives previous layer's output).
        Returns a DebiasResult with the final debiased text, score, and full layer trace.
        """
        raise NotImplementedError
''',
    "services/debias_engine/layer1_qlora.py": '''"""
Layer 1 Adapter wrapper.
"""
class Layer1QLoRA:
    async def apply(self, text: str) -> str:
        raise NotImplementedError
''',
    "services/debias_engine/layer2_rldf.py": '''"""
Layer 2 RLDF wrapper.
"""
class Layer2RLDF:
    async def apply(self, text: str) -> str:
        raise NotImplementedError
''',
    "services/debias_engine/layer3_postprocess.py": '''"""
Layer 3 Post-processing wrapper.
"""
class Layer3PostProcess:
    async def apply(self, text: str) -> str:
        raise NotImplementedError
''',
    "services/debias_engine/orchestrator.py": '''"""
Pipeline configurator.
"""
class PipelineOrchestrator:
    pass
''',
    "services/debias_engine/result.py": '''"""
Result dataclasses for Debias Engine.
"""
from dataclasses import dataclass
from typing import List, Any
@dataclass
class DebiasResult:
    original_text: str
    debiased_text: str
    score: float
    trace: List[Any]
''',
    "services/bias_scorer/scorer.py": '''"""
Bias Scorer.
Runs multiple bias detectors in parallel and aggregates the score.
"""
from typing import Dict, Any
class BiasScoreResult:
    pass
class BiasScorer:
    """Main entry point for bias detection."""
    async def score(self, text: str) -> BiasScoreResult:
        """
        Runs all enabled detectors in parallel (asyncio.gather).
        Aggregates dimension scores into a single 0–100 fairness score.
        Higher score = more fair.
        Returns detected bias types and their per-dimension scores.
        """
        raise NotImplementedError
''',
    "services/bias_scorer/detectors/gender.py": '''"""Gender bias detector."""
class GenderDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/detectors/racial.py": '''"""Racial bias detector."""
class RacialDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/detectors/age.py": '''"""Age bias detector."""
class AgeDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/detectors/geographic.py": '''"""Geographic bias detector."""
class GeographicDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/detectors/socioeconomic.py": '''"""Socioeconomic bias detector."""
class SocioeconomicDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/aggregator.py": '''"""
Aggregates individual bias scores.
"""
class ScoreAggregator:
    def aggregate(self, scores: dict[str, float]) -> float:
        raise NotImplementedError
''',
    "services/bias_scorer/word_lists/gender_terms.json": '{"he": "she", "man": "woman"}',
    "services/bias_scorer/word_lists/racial_slurs.json": '[]',
    "services/bias_scorer/word_lists/geographic_flags.json": '[]',
    "services/audit_logger/logger.py": '''"""
Auditing logger.
Creates tamper-evident logs using SHA-256 chains.
"""
from dataclasses import dataclass
@dataclass
class AuditEntry:
    pass
class AuditLogger:
    """Tamper-evident logger."""
    async def log(self, entry: AuditEntry) -> str:
        """
        Persists an audit entry to PostgreSQL.
        Computes SHA-256 hash = hash(entry_data + previous_block_hash) for chain integrity.
        Returns the entry ID.
        """
        raise NotImplementedError
    async def verify_chain(self, tenant_id: str) -> bool:
        """
        Recomputes the hash chain from genesis and checks every block.
        Returns True if the chain is intact (no tampering detected).
        """
        raise NotImplementedError
''',
    "services/audit_logger/models.py": '''"""ORM Models for Audits."""
from db.base import Base
class AuditLog(Base):
    __tablename__ = "audit_logs"
class HashBlock(Base):
    __tablename__ = "hash_blocks"
''',
    "services/audit_logger/exporter.py": '''"""Exports logs to PDF/CSV."""
class LogExporter:
    pass
''',
    "services/audit_logger/worker.py": '''"""Celery worker for async storage."""
from celery import Celery
celery_app = Celery()
''',
    "services/audit_logger/migrations/001_initial.sql": '''-- Initial migration
CREATE TABLE audit_logs (id SERIAL PRIMARY KEY);
CREATE TABLE hash_blocks (id SERIAL PRIMARY KEY);
''',
    "services/reward_model/judge.py": '''"""
Reward Model Judge.
Scores text pairs for RLDF.
"""
class RewardModelJudge:
    """AI judge for Layer 2 debates."""
    async def score_pair(
        self,
        prompt: str,
        biased_response: str,
        debiased_response: str,
    ) -> float:
        """
        Sends both responses to the AI judge LLM.
        Returns a reward score between -1.0 (biased wins) and +1.0 (debiased wins).
        Used as the PPO reward signal in RLDF training.
        """
        raise NotImplementedError
''',
    "services/reward_model/debate_generator.py": '''"""Generates debate inputs."""
class DebateGenerator:
    pass
''',
    "services/reward_model/scorer.py": '''"""Reward Scorer logic."""
class RewardScorer:
    pass
''',
    "services/reward_model/prompts.py": '''"""Prompt templates for Judge."""
JUDGE_SYSTEM_PROMPT = "You are an AI fairness judge."
''',
    "services/report_generator/generator.py": '''"""Generates compliance reports."""
class ReportGenerator:
    pass
''',
    "services/report_generator/pdf_builder.py": '''"""Builds PDFs."""
class PDFBuilder:
    pass
''',
    "services/report_generator/csv_exporter.py": '''"""Builds CSVs."""
class CSVExporter:
    pass
''',
    "ml/qlora/train.py": '''"""
QLoRA Training script.
Uses peft and bitsandbytes for fine-tuning.
"""
def train():
    pass
''',
    "ml/qlora/config.py": '''"""QLoRA config classes."""
from dataclasses import dataclass
@dataclass
class QLoRAConfig:
    rank: int = 8
''',
    "ml/qlora/dataset.py": '''"""CDA Dataset Loading."""
class CDADataset:
    pass
''',
    "ml/qlora/evaluate.py": '''"""Eval script for adapters."""
def evaluate():
    pass
''',
    "ml/cda/augmentor.py": '''"""Counterfactual Data Augmentation."""
class CDAugmentor:
    pass
''',
    "ml/cda/swap_rules.py": '''"""Rules for term swapping."""
class SwapRules:
    pass
''',
    "ml/cda/pipeline.py": '''"""CDA pipeline generation."""
class CDAPipeline:
    pass
''',
    "ml/rldf/train.py": '''"""RLDF Training (PPO)."""
def train_rldf():
    pass
''',
    "ml/rldf/ppo_trainer.py": '''"""PPO Wrapper."""
class PPOTrainerWrapper:
    pass
''',
    "ml/rldf/debate_loop.py": '''"""Multi-role debate logic."""
class DebateLoop:
    pass
''',
    "ml/rldf/config.py": '''"""RLDF configs."""
from dataclasses import dataclass
@dataclass
class RLDFConfig:
    fairness_lambda: float = 0.7
''',
    "ml/postprocess/projector.py": '''"""
Embedding Projection.
"""
import torch
class EmbeddingProjector:
    def project(self, embedding: torch.Tensor, bias_axis: torch.Tensor) -> torch.Tensor:
        raise NotImplementedError
''',
    "ml/postprocess/bias_axis.py": '''"""Calculates bias axis."""
class BiasAxis:
    pass
''',
    "ml/postprocess/rewriter.py": '''"""Rewrites spans using postprocess."""
class Rewriter:
    pass
''',
    "ml/postprocess/config.py": '''"""Postprocess config."""
from dataclasses import dataclass
@dataclass
class PostprocessConfig:
    pass
''',
    "tests/test_debias_engine.py": '''"""Tests for debias engine."""
def test_engine():
    pass
''',
    "tests/test_bias_scorer.py": '''"""Tests for bias scorer."""
def test_scorer():
    pass
''',
    "tests/test_audit_logger.py": '''"""Tests for audit logger."""
def test_audit():
    pass
''',
    "tests/test_api_debias.py": '''"""Tests for debias api endpoint."""
def test_debias_endpoint():
    pass
''',
    "tests/conftest.py": '''"""Pytest fixtures."""
import pytest
''',
    "docker-compose.yml": '''version: "3.8"
services:
  api-gateway:
    build: .
    ports:
      - "8000:8000"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: db
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  celery-worker:
    build: .
    command: celery -A services.audit_logger.worker worker --loglevel=info
  flower:
    build: .
    command: celery -A services.audit_logger.worker flower --port=5555
    ports:
      - "5555:5555"
''',
    "Dockerfile": '''FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "services.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
''',
    "requirements.txt": '''fastapi==0.111.*
uvicorn[standard]
sqlalchemy==2.0.*
asyncpg
pydantic-settings
structlog
celery
redis
peft==0.11.*
trl==0.9.*
torch==2.3.*
transformers
bitsandbytes
''',
    "requirements-dev.txt": '''pytest
pytest-asyncio
ruff
mypy
''',
    ".env.example": '''# LLM Providers (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
# Database Connection String
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/db
# Redis Connection String
REDIS_URL=redis://localhost:6379/0
# Reward Model specification for RLDF
REWARD_MODEL=gpt-4o
# Fairness shaping coefficient (0.0-1.0)
FAIRNESS_LAMBDA=0.7
# Bias threshold to flag outputs
BIAS_THRESHOLD=0.6
# Toggles for features
LAYER1_ENABLED=True
LAYER2_ENABLED=True
LAYER3_ENABLED=True
MAX_REQUESTS_PER_MINUTE=60
''',
    "pyproject.toml": '''[tool.poetry]
name = "lm-sense"
version = "0.1.0"
description = "LM-Sense Backend"
[tool.ruff]
line-length = 100
[tool.mypy]
strict = true
'''
}
for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("Scaffold complete.")
