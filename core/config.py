"""
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
