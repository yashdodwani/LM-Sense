"""
core/config.py — LM-Sense global configuration

Loads all environment variables using pydantic-settings.
Single source of truth for every service in the monorepo.
Import `settings` wherever config is needed — never read os.environ directly.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_NAME: str = "LM-Sense"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── LLM Providers (at least one required) ─────────────────────────────
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://lmsense:lmsense@localhost:5432/lmsense"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ── Redis ─────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Auth ──────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT signing")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60

    # ── Debiasing Pipeline ────────────────────────────────────────────────
    REWARD_MODEL: str = "gpt-4o"           # AI judge used in RLDF layer
    FAIRNESS_LAMBDA: float = 0.7           # Fairness vs fluency trade-off (0.0–1.0)
    BIAS_THRESHOLD: float = 0.6            # Flag outputs with score below this
    LAYER1_ENABLED: bool = True            # QLoRA + CDA layer
    LAYER2_ENABLED: bool = True            # RLDF layer
    LAYER3_ENABLED: bool = True            # RL post-processing layer

    # ── Rate Limiting ─────────────────────────────────────────────────────
    MAX_REQUESTS_PER_MINUTE: int = 60      # Per tenant, sliding window

    # ── CORS ─────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Celery ───────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── Observability ─────────────────────────────────────────────────────
    SENTRY_DSN: str | None = None
    WANDB_API_KEY: str | None = None       # Optional — for ML training runs

    @model_validator(mode="after")
    def at_least_one_llm_key(self) -> "Settings":
        if not any([self.OPENAI_API_KEY, self.ANTHROPIC_API_KEY, self.GEMINI_API_KEY]):
            raise ValueError(
                "At least one LLM provider API key must be set: "
                "OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance. Use this everywhere."""
    return Settings()


# Convenience alias
settings = get_settings()