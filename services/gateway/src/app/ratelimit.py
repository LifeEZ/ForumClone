"""Redis-backed fixed-window rate limiting.

The gateway is the single public entry point, so it's the natural place to throttle
abuse. Keyed per client (token subject when present, else IP). If no Redis URL is
configured the limiter is a no-op — local dev stays friction-free (ADR-0002).
"""

from __future__ import annotations

import jwt
from hiver_auth_contract import CLAIM_SUB
from redis.asyncio import Redis

from app.config import settings

_redis: Redis | None = None


def _get_redis() -> Redis | None:
    global _redis
    if not settings.redis_url:
        return None
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _client_key(authorization: str | None, client_ip: str) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:]
        try:
            sub = jwt.decode(token, options={"verify_signature": False}).get(CLAIM_SUB)
            if sub:
                return f"rl:user:{sub}"
        except jwt.PyJWTError:
            pass
    return f"rl:ip:{client_ip}"


async def check_rate_limit(
    authorization: str | None, client_ip: str
) -> int | None:
    """Return ``None`` if allowed, or the seconds until the window resets."""
    redis = _get_redis()
    if redis is None:
        return None

    key = _client_key(authorization, client_ip)
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, settings.rate_limit_window_seconds)
    if count <= settings.rate_limit_requests:
        return None
    ttl = await redis.ttl(key)
    return max(ttl, 1)


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
