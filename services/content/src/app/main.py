from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (register ORM models)
from app.config import settings
from app.database import async_session_factory, engine
from app.karma_relay import start_relay


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    stop_relay: Callable[[], Awaitable[None]] | None = None
    if settings.karma_relay_enabled and settings.internal_token:
        stop_relay = start_relay(
            async_session_factory,
            identity_url=settings.identity_url,
            internal_token=settings.internal_token,
            interval_seconds=settings.karma_relay_interval_seconds,
            batch_size=settings.karma_relay_batch_size,
        )
    yield
    if stop_relay is not None:
        await stop_relay()
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Hiver Content",
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.api.router import api_router

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "content"}

    return app


app = create_app()
