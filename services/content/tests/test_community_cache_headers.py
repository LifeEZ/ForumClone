"""Documents why the gateway marks API responses as Vary: Authorization.

GET /communities/{name} returns per-user `is_member` that differs depending on
whether an `Authorization` header is sent, even though the URL is identical.
That is the underlying reason a cache keyed on URL alone cannot be trusted for
these responses — see the gateway cache-header regression tests for the fix.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


async def _seed_community(client: AsyncClient, headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/communities",
        json={"name": "films", "display_name": "Films", "description": None},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text


async def test_community_get_membership_differs_by_auth(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """Same URL returns different `is_member` depending on Authorization.

    Creating a community auto-joins the creator, so the authenticated request
    sees `is_member=True` while the anonymous one sees `None`.
    """
    await _seed_community(client, auth_headers)

    with_auth = await client.get("/api/v1/communities/films", headers=auth_headers)
    without_auth = await client.get("/api/v1/communities/films")
    assert with_auth.json()["is_member"] is True
    assert without_auth.json()["is_member"] is None
