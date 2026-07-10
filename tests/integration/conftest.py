"""Fixtures for cross-service integration tests.

Requires the compose stack:
    docker compose up -d identity_db content_db identity content

Skips automatically when identity (:8001) or content (:8002) is not reachable.
"""

from __future__ import annotations

import os

import httpx
import pytest

IDENTITY_URL = os.environ.get("IDENTITY_URL", "http://localhost:8001")
CONTENT_URL = os.environ.get("CONTENT_URL", "http://localhost:8002")


async def _health_ok(base_url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{base_url}/health")
            return resp.status_code == 200
    except httpx.HTTPError:
        return False


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(scope="session")
async def compose_stack() -> None:
    identity_up = await _health_ok(IDENTITY_URL)
    content_up = await _health_ok(CONTENT_URL)
    if not identity_up or not content_up:
        pytest.skip(
            "Compose stack not running. Start with:\n"
            "  docker compose up -d identity_db content_db identity content"
        )


@pytest.fixture
async def http() -> httpx.AsyncClient:
    async with httpx.AsyncClient(timeout=15.0) as client:
        yield client
