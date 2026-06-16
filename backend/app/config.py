"""
config.py – Centralised application settings loaded from environment variables.
All config values should be accessed via `get_settings()` to support caching.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────
    app_name: str = "Family Office API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    secret_key: str = "changeme"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    # ── Database (built from parts so .env vars are actually used) ─
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "family_office"

    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_echo: bool = False  # log SQL queries in debug mode

    @computed_field  # type: ignore[misc]
    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[misc]
    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ── JWT ────────────────────────────────────────────────────────
    jwt_secret_key: str = "changeme-jwt"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # ── Gemini (via OpenAI-compatible endpoint) ──────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    gemini_max_tokens: int = 2048

    # ── Redis / Celery ────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ── File Storage ──────────────────────────────────────────────
    storage_backend: str = "local"  # local | s3
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10
    allowed_file_types: str = "image/jpeg,image/png,image/webp,application/pdf"

    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "family-office-uploads"

    # ── Email ─────────────────────────────────────────────────────
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = "noreply@family-office.com"
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587
    mail_tls: bool = True

    # ── Rate Limiting ─────────────────────────────────────────────
    rate_limit_per_minute: int = 60
    rate_limit_auth_per_minute: int = 10

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def allowed_mimetypes(self) -> List[str]:
        return [t.strip() for t in self.allowed_file_types.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance (loaded once at startup)."""
    return Settings()
