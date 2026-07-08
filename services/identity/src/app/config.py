from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/identity_db"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/identity_test"

    # RS256 keypair (PEM). Leave blank in local dev to auto-generate an ephemeral pair.
    jwt_private_key_pem: str = ""
    jwt_public_key_pem: str = ""
    jwt_key_id: str = "hiver-identity-key"

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
