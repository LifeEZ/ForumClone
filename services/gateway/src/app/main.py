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
from hiver_routing import CONTENT_PREFIXES, IDENTITY_PREFIXES

from app.config import settings
from app.ratelimit import check_rate_limit, close_redis

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
    # First path segment (after /api/v1/) -> downstream service base URL.
    # The prefix sets come from the shared `hiver_routing` contract so
    # they can't drift from what each service actually serves.
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

    @app.middleware("http")
    async def enforce_auth_aware_caching(request: Request, call_next):
        """Stop caches serving a stale unauthenticated body to an authed request.

        API responses carry per-user data (e.g. ``is_member``, ``user_vote``)
        that varies by the ``Authorization`` header but is indistinguishable to
        a cache keyed on URL alone. Every API response therefore ``Vary``ies on
        ``Authorization`` and defaults to uncachable. A route that *wants* to be
        cached sets its own ``Cache-Control`` and this middleware leaves it in
        place (non-clobbering), so genuinely public endpoints can opt in.
        """
        response = await call_next(request)
        if request.url.path.startswith("/api/v1/"):
            existing_vary = response.headers.get("vary", "")
            varies = [v.strip() for v in existing_vary.split(",") if v.strip()]
            if not any(v.lower() == "authorization" for v in varies):
                varies.append("Authorization")
            response.headers["vary"] = ", ".join(varies)
            if not response.headers.get("cache-control"):
                response.headers["cache-control"] = "no-store, must-revalidate"
        return response

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
