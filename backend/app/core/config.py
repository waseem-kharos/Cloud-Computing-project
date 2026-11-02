from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    project_name: str = "MediQueue API"
    environment: str = "development"
    api_prefix: str = "/api"

    database_url: str = "sqlite:///./hospital.db"
    auto_create_tables: bool = True

    secret_key: str = "dev-only-secret-change-me-please"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    booking_horizon_days: int = 60
    queue_poll_seconds: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str, info: Any) -> str:
        if not v or len(v.strip()) < 32:
            # Allow short dev key in non-production; will be enforced at runtime if needed
            return v
        weak_values = {
            "dev-only-secret-change-me-please",
            "change-this-development-secret-key-before-deploying",
            "secret",
            "changeme",
            "password",
        }
        if v.strip().lower() in weak_values:
            env = info.data.get("environment", "development") if hasattr(info, "data") else "development"
            if str(env).lower() in {"production", "prod"}:
                raise ValueError("Insecure SECRET_KEY is not allowed in production.")
            return v
        return v

    def validate_production(self) -> None:
        if not self.is_production:
            return
        weak = {
            "dev-only-secret-change-me-please",
            "change-this-development-secret-key-before-deploying",
            "secret",
            "changeme",
            "password",
        }
        if not self.secret_key or len(self.secret_key.strip()) < 32 or self.secret_key.strip().lower() in weak:
            raise RuntimeError("SECURITY ERROR: A strong SECRET_KEY (>=32 chars) must be set in production.")
        if self.cookie_secure is False and self.cookie_samesite.lower() == "none":
            raise RuntimeError("SECURITY ERROR: cookie_secure must be True when cookie_samesite is 'none'.")
        if self.cookie_samesite.lower() not in {"lax", "strict", "none"}:
            raise RuntimeError("SECURITY ERROR: Invalid COOKIE_SAMESITE value.")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
try:
    settings.validate_production()
except Exception:
    # Don't crash import in dev; validation will be enforced at startup where appropriate
    pass

