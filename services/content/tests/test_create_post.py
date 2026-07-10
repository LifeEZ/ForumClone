import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post

pytestmark = pytest.mark.anyio


async def _seed_community(client: AsyncClient, headers: dict[str, str]) -> str:
    resp = await client.post(
        "/api/v1/communities",
        json={"name": "films", "display_name": "Films", "description": None},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def test_create_post_happy_path(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    community_id = await _seed_community(client, auth_headers)

    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Hello world", "content": "First post"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["title"] == "Hello world"
    assert data["content"] == "First post"
    assert data["community_id"] == community_id
    assert data["score"] == 0
    assert data["upvotes"] == 0
    assert data["downvotes"] == 0
    assert data["comment_count"] == 0
    assert data["is_deleted"] is False

    assert data["author"]["id"] == "u-test"
    assert data["author"]["username"] == "test_user"

    post = await session.scalar(select(Post).where(Post.title == "Hello world"))
    assert post is not None
    assert post.author_id == "u-test"
    assert post.author_username == "test_user"
    assert post.post_type == "text"
    assert post.score == 0
    assert post.community_id == community_id


async def test_create_post_without_content(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    await _seed_community(client, auth_headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Title only"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["content"] is None


async def test_create_post_unauthenticated_returns_401(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Hello"},
    )
    assert resp.status_code == 401


async def test_create_post_non_member_returns_403(
    client: AsyncClient,
    auth_headers: dict[str, str],
    auth_headers2: dict[str, str],
) -> None:
    # u-test creates the community and is auto-joined; u-test2 is not a member.
    await _seed_community(client, auth_headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Invader"},
        headers=auth_headers2,
    )
    assert resp.status_code == 403

    # No post row should be left behind for the rejected author.
    posts = (await client.get("/api/v1/communities/films/posts", headers=auth_headers)).json()
    titles = [p["title"] for p in posts]
    assert "Invader" not in titles


async def test_create_post_unknown_community_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/communities/ghost/posts",
        json={"title": "Hello"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "x", "post_type": "link", "url": "https://example.com"},
        {"title": "x", "url": "https://example.com"},
        {"title": "x", "post_type": "image"},
    ],
)
async def test_create_post_non_text_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
    payload: dict[str, object],
) -> None:
    await _seed_community(client, auth_headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json=payload,
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_create_post_title_too_long_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    await _seed_community(client, auth_headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "x" * 301},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_create_post_content_too_long_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    await _seed_community(client, auth_headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "x", "content": "y" * 40001},
        headers=auth_headers,
    )
    assert resp.status_code == 422
