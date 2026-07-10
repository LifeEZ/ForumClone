import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community
from app.models.membership import CommunityMembership

pytestmark = pytest.mark.anyio


VALID_PAYLOAD = {
    "name": "films",
    "display_name": "Films",
    "description": "Talk about films",
}


async def test_create_community_happy_path(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post("/api/v1/communities", json=VALID_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "films"
    assert data["display_name"] == "Films"
    assert data["description"] == "Talk about films"
    assert data["member_count"] == 1
    assert data["is_member"] is True
    assert data["creator_id"] == "u-test"

    # Community row persisted.
    community = await session.scalar(select(Community).where(Community.name == "films"))
    assert community is not None
    assert community.creator_id == "u-test"


async def test_creator_auto_joined_with_creator_role(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post("/api/v1/communities", json=VALID_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201

    # Visible through the public "mine" surface.
    mine = await client.get("/api/v1/communities/mine", headers=auth_headers)
    assert mine.status_code == 200
    names = [c["name"] for c in mine.json()]
    assert "films" in names

    membership = await session.scalar(
        select(CommunityMembership).where(
            CommunityMembership.user_id == "u-test",
            CommunityMembership.community_id == resp.json()["id"],
        )
    )
    assert membership is not None
    assert membership.role == "creator"


async def test_create_community_unauthenticated_returns_401(
    client: AsyncClient,
) -> None:
    resp = await client.post("/api/v1/communities", json=VALID_PAYLOAD)
    assert resp.status_code == 401


async def test_create_community_duplicate_returns_409(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    first = await client.post("/api/v1/communities", json=VALID_PAYLOAD, headers=auth_headers)
    assert first.status_code == 201

    second = await client.post(
        "/api/v1/communities",
        json={"name": "films", "display_name": "Other"},
        headers=auth_headers,
    )
    assert second.status_code == 409
    assert "films" in second.json()["detail"].lower() or "taken" in second.json()["detail"].lower()


async def test_create_community_is_atomic_on_duplicate(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
    auth_headers2: dict[str, str],
) -> None:
    # User 1 seeds a community named "films".
    first = await client.post("/api/v1/communities", json=VALID_PAYLOAD, headers=auth_headers)
    assert first.status_code == 201

    # User 2 tries the same name; neither a community nor a creator membership
    # for user 2 should be left behind by the failed attempt.
    resp = await client.post(
        "/api/v1/communities",
        json={"name": "films", "display_name": "Other"},
        headers=auth_headers2,
    )
    assert resp.status_code == 409

    memberships = (
        (
            await session.execute(
                select(CommunityMembership).where(CommunityMembership.user_id == "u-test2")
            )
        )
        .scalars()
        .all()
    )
    assert len(memberships) == 0

    orphaned = await session.scalar(select(Community).where(Community.creator_id == "u-test2"))
    assert orphaned is None


@pytest.mark.parametrize(
    "name",
    [
        "Films",  # uppercase
        "web_dev",  # disallowed character (underscore)
        "ab",  # too short
        "a" * 31,  # too long
        "-films",  # leading hyphen
        "films-",  # trailing hyphen
        "mine",  # reserved slug
    ],
)
async def test_create_community_invalid_name_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
    name: str,
) -> None:
    resp = await client.post(
        "/api/v1/communities",
        json={"name": name, "display_name": "X"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.parametrize("name", ["films", "web-dev", "c42"])
async def test_create_community_valid_names_accepted(
    client: AsyncClient,
    auth_headers: dict[str, str],
    name: str,
) -> None:
    resp = await client.post(
        "/api/v1/communities",
        json={"name": name, "display_name": "X"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text


async def test_create_community_description_too_long_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/communities",
        json={
            "name": "films",
            "display_name": "Films",
            "description": "x" * 501,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
