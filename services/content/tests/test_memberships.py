import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community

pytestmark = pytest.mark.anyio


async def _seed_community(session: AsyncSession) -> Community:
    community = Community(
        id="c-test",
        name="testcomm",
        display_name="Test Community",
        description="For membership tests",
        creator_id="seed-creator",
        member_count=1,
    )
    session.add(community)
    await session.commit()
    return community


async def test_join_community(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    community = await _seed_community(session)

    resp = await client.post(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_member"] is True
    assert data["member_count"] == 2

    detail = await client.get(
        f"/api/v1/communities/{community.name}",
        headers=auth_headers,
    )
    assert detail.status_code == 200
    assert detail.json()["is_member"] is True


async def test_join_twice_returns_409(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    community = await _seed_community(session)

    first = await client.post(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )
    assert first.status_code == 200

    second = await client.post(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )
    assert second.status_code == 409


async def test_leave_community(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    community = await _seed_community(session)

    await client.post(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )

    resp = await client.delete(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_member"] is False
    assert data["member_count"] == 1


async def test_leave_when_not_member_returns_404(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    community = await _seed_community(session)

    resp = await client.delete(
        f"/api/v1/communities/{community.name}/join",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_join_unknown_community_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/communities/missing/join",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_join_unauthenticated_returns_401(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    community = await _seed_community(session)

    resp = await client.post(f"/api/v1/communities/{community.name}/join")
    assert resp.status_code == 401


async def test_list_joined_communities(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
    auth_headers2: dict[str, str],
) -> None:
    community_a = Community(
        id="c-a",
        name="alpha",
        display_name="Alpha",
        creator_id="seed",
        member_count=1,
    )
    community_b = Community(
        id="c-b",
        name="beta",
        display_name="Beta",
        creator_id="seed",
        member_count=1,
    )
    session.add_all([community_a, community_b])
    await session.commit()

    await client.post("/api/v1/communities/alpha/join", headers=auth_headers)
    await client.post("/api/v1/communities/beta/join", headers=auth_headers2)

    resp = await client.get("/api/v1/communities/mine", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "alpha"
    assert data[0]["is_member"] is True
