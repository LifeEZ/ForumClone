import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import _target_base, create_app


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.anyio
async def test_health() -> None:
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "gateway"


def test_routing_table() -> None:
    assert _target_base("auth") == settings.identity_url
    assert _target_base("users") == settings.identity_url
    assert _target_base("communities") == settings.content_url
    assert _target_base("posts") == settings.content_url
    assert _target_base("votes") == settings.content_url
    assert _target_base("nonsense") is None


@pytest.mark.anyio
async def test_unknown_prefix_returns_404() -> None:
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/nonsense/thing")
    assert resp.status_code == 404
