from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _to_asyncpg(url: str) -> str:
    if not url.startswith("postgresql://"):
        return url
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query)) if parts.query else {}
    clean: dict[str, str] = {}
    if "sslmode" in query:
        clean["ssl"] = query["sslmode"]
    elif "ssl" in query:
        clean["ssl"] = query["ssl"]
    return urlunsplit(parts._replace(query=urlencode(clean)))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/identity_db"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/identity_test"

    @field_validator("database_url", "test_database_url", mode="before")
    @classmethod
    def _coerce_asyncpg(cls, v: str) -> str:
        return _to_asyncpg(v)

    # RS256 keypair (PEM). Leave blank in local dev to auto-generate an ephemeral pair.
    jwt_private_key_pem: str = ""
    jwt_public_key_pem: str = ""
    jwt_key_id: str = "hiver-identity-key"

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Shared secret guarding the internal /internal/karma endpoint (ADR-0003).
    internal_token: str = ""

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
