"""Hiver API Gateway.

Single public entry point. Verifies nothing about identity itself — it just routes
by path prefix to the Identity or Content service, applies CORS, and enforces
Redis-backed rate limiting. Each downstream service verifies the JWT itself.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.ratelimit import check_rate_limit, close_redis

# First path segment (after /api/v1/) -> downstream service base URL.
IDENTITY_PREFIXES = {"auth", "users", ".well-known"}
CONTENT_PREFIXES = {"communities", "posts", "comments", "votes"}

_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.client.aclose()
    await close_redis()


def _target_base(first_segment: str) -> str | None:
    if first_segment in IDENTITY_PREFIXES:
        return settings.identity_url
    if first_segment in CONTENT_PREFIXES:
        return settings.content_url
    return None


def create_app() -> FastAPI:
    app = FastAPI(title="Hiver Gateway", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "gateway"}

    @app.api_route(
        "/api/v1/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    async def proxy(path: str, request: Request) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        authorization = request.headers.get("authorization")
        if not await check_rate_limit(authorization, client_ip):
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
            )

        first_segment = path.split("/", 1)[0]
        base = _target_base(first_segment)
        if base is None:
            return Response(
                content='{"detail":"Not found"}',
                status_code=404,
                media_type="application/json",
            )

        url = f"{base}/api/v1/{path}"
        body = await request.body()
        forward_headers = {k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP}

        client: httpx.AsyncClient = request.app.state.client
        upstream = await client.request(
            request.method,
            url,
            params=request.query_params,
            headers=forward_headers,
            content=body,
        )

        response_headers = {
            k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP
        }
        return Response(
            content=upstream.content,
            status_code=upstream.status_code,
            headers=response_headers,
        )

    return app


app = create_app()
