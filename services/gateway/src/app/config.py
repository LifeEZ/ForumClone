from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    identity_url: str = "http://localhost:8001"
    content_url: str = "http://localhost:8002"

    # Redis for rate limiting. Leave blank to disable (e.g. local dev without Redis).
    redis_url: str = ""
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
