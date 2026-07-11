from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _to_asyncpg(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/content_db"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/content_test"

    @field_validator("database_url", "test_database_url", mode="before")
    @classmethod
    def _coerce_asyncpg(cls, v: str) -> str:
        return _to_asyncpg(v)

    # Identity service base URL — Content fetches its public key from here to verify tokens
    # and relays karma deltas to its /internal/karma endpoint (ADR-0003).
    identity_url: str = "http://localhost:8001"
    jwt_key_id: str = "hiver-identity-key"

    # Shared secret guarding Identity's /internal/karma endpoint (ADR-0003).
    internal_token: str = ""

    # Outbox→Identity karma relay (ADR-0003). Disabled in tests.
    karma_relay_enabled: bool = True
    karma_relay_interval_seconds: float = 2.0
    karma_relay_batch_size: int = 50

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
