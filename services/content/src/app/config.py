from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/content_db"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/content_test"

    # Identity service base URL — Content fetches its public key from here to verify tokens.
    identity_url: str = "http://localhost:8001"
    jwt_key_id: str = "hiver-identity-key"

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
