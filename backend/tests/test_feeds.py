import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community
from app.models.post import Post
from app.models.user import User
from app.services.auth import hash_password

pytestmark = pytest.mark.anyio


async def _seed_feed_data(session: AsyncSession) -> tuple[Community, Post]:
    password_hash = hash_password("not-used")
    author = User(
        id="test-author",
        username="feed_author",
        email="feed_author@test.hiver",
        password_hash=password_hash,
        karma=10,
        is_active=False,
    )
    community = Community(
        id="test-community",
        name="testcomm",
        display_name="Test Community",
        description="For feed tests",
        creator_id=author.id,
        member_count=1,
    )
    post = Post(
        id="test-post",
        title="Hello feed",
        content="Body text",
        community_id=community.id,
        author_id=author.id,
        score=5,
        comment_count=0,
    )
    session.add_all([author, community, post])
    await session.commit()
    return community, post


async def test_list_global_posts(client: AsyncClient, session: AsyncSession) -> None:
    community, post = await _seed_feed_data(session)

    resp = await client.get("/api/v1/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    item = data[0]
    assert item["id"] == post.id
    assert item["title"] == "Hello feed"
    assert item["community_id"] == community.id
    assert item["author"]["username"] == "feed_author"
    assert item["upvotes"] == 5
    assert item["downvotes"] == 0
    assert item["user_vote"] == 0


async def test_list_communities(client: AsyncClient, session: AsyncSession) -> None:
    await _seed_feed_data(session)

    resp = await client.get("/api/v1/communities")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "testcomm"
    assert data[0]["display_name"] == "Test Community"


async def test_get_community_by_name(client: AsyncClient, session: AsyncSession) -> None:
    await _seed_feed_data(session)

    resp = await client.get("/api/v1/communities/testcomm")
    assert resp.status_code == 200
    assert resp.json()["name"] == "testcomm"


async def test_get_community_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/communities/missing")
    assert resp.status_code == 404


async def test_list_community_posts(client: AsyncClient, session: AsyncSession) -> None:
    community, post = await _seed_feed_data(session)

    resp = await client.get(f"/api/v1/communities/{community.name}/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == post.id


async def test_get_post_by_id(client: AsyncClient, session: AsyncSession) -> None:
    _, post = await _seed_feed_data(session)

    resp = await client.get(f"/api/v1/posts/{post.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Hello feed"


async def test_get_post_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/posts/missing-id")
    assert resp.status_code == 404


async def test_posts_pagination(client: AsyncClient, session: AsyncSession) -> None:
    community, _ = await _seed_feed_data(session)
    author_id = "test-author"
    for i in range(4):
        session.add(
            Post(
                id=f"extra-post-{i}",
                title=f"Post {i}",
                community_id=community.id,
                author_id=author_id,
                score=i,
            )
        )
    await session.commit()

    resp = await client.get("/api/v1/posts?limit=2&offset=0")
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    resp = await client.get("/api/v1/posts?limit=2&offset=2")
    assert resp.status_code == 200
    assert len(resp.json()) == 2
