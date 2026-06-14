from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/redditclone"
    test_database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5433/redditclone_test"
    )
    secret_key: str = "dev-only-secret-key-must-be-32-chars-min"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10 MB
    upload_dir: str = "uploads"


settings = Settings()
