from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community
from app.models.post import Post

pytestmark = pytest.mark.anyio


async def _seed_two_communities_with_posts(session: AsyncSession) -> tuple[Community, Community]:
    joined = Community(
        id="c-joined",
        name="joined",
        display_name="Joined",
        creator_id="seed",
    )
    other = Community(
        id="c-other",
        name="other",
        display_name="Other",
        creator_id="seed",
    )
    session.add_all([joined, other])
    await session.flush()

    now = datetime.now(UTC).replace(tzinfo=None)
    session.add_all(
        [
            Post(
                id="p-old",
                title="Older joined post",
                community_id=joined.id,
                author_id="seed",
                author_username="seed",
                created_at=now - timedelta(days=2),
            ),
            Post(
                id="p-new",
                title="Newer joined post",
                community_id=joined.id,
                author_id="seed",
                author_username="seed",
                created_at=now - timedelta(days=1),
            ),
            Post(
                id="p-other",
                title="Other community post",
                community_id=other.id,
                author_id="seed",
                author_username="seed",
                created_at=now,
            ),
        ]
    )
    await session.commit()
    return joined, other


async def test_home_feed_unauthenticated_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/posts/home")
    assert resp.status_code == 401


async def test_home_feed_no_joins_returns_empty(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    await _seed_two_communities_with_posts(session)

    resp = await client.get("/api/v1/posts/home", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_home_feed_returns_joined_posts_newest_first(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    joined, _ = await _seed_two_communities_with_posts(session)

    join_resp = await client.post(
        f"/api/v1/communities/{joined.name}/join",
        headers=auth_headers,
    )
    assert join_resp.status_code == 200

    resp = await client.get("/api/v1/posts/home", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["id"] == "p-new"
    assert data[1]["id"] == "p-old"
    assert all(item["community_id"] == joined.id for item in data)
