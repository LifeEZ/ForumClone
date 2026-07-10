"""Regression tests for the gateway's auth-aware cache headers.

The gateway is the single public entry point, so it's the right place to stop
caches serving a stale unauthenticated body to an authenticated request. Every
`/api/v1/*` response must `Vary: Authorization` and default to uncachable; a
route that sets its own `Cache-Control` must win (non-clobbering) so public
endpoints can opt into caching later.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


class _FakeUpstreamResp:
    def __init__(self, status_code: int, content: bytes, headers: dict[str, str]) -> None:
        self.status_code = status_code
        self.content = content
        self.headers = headers


class _FakeUpstreamClient:
    def __init__(self, resp: _FakeUpstreamResp) -> None:
        self._resp = resp

    async def request(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        return self._resp

    async def aclose(self) -> None:
        pass


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


async def _proxied_get(resp: _FakeUpstreamResp) -> "any":
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        app.state.client = _FakeUpstreamClient(resp)
        return await client.get("/api/v1/communities/films")


@pytest.mark.anyio
async def test_default_response_is_uncachable_and_varies_by_auth() -> None:
    resp = await _proxied_get(
        _FakeUpstreamResp(
            200,
            b'{"is_member":null}',
            {"content-type": "application/json"},
        )
    )
    assert resp.status_code == 200
    assert resp.headers["cache-control"] == "no-store, must-revalidate"
    assert resp.headers["vary"] == "Authorization"


@pytest.mark.anyio
async def test_existing_cache_control_is_not_clobbered() -> None:
    """A route that opts into caching keeps its own Cache-Control."""
    resp = await _proxied_get(
        _FakeUpstreamResp(
            200,
            b"{}",
            {
                "content-type": "application/json",
                "cache-control": "public, max-age=60",
                "vary": "Cookie",
            },
        )
    )
    assert resp.headers["cache-control"] == "public, max-age=60"
    varies = [v.strip().lower() for v in resp.headers["vary"].split(",")]
    assert "cookie" in varies
    assert "authorization" in varies
