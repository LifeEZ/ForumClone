import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post

pytestmark = pytest.mark.anyio


async def _seed_community(client: AsyncClient, headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/communities",
        json={"name": "films", "display_name": "Films", "description": None},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text


async def _seed_post(client: AsyncClient, headers: dict[str, str]) -> str:
    await _seed_community(client, headers)
    resp = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Threaded post", "content": "discuss"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def _create_comment(
    client: AsyncClient,
    headers: dict[str, str],
    post_id: str,
    content: str,
    parent_id: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {"content": content}
    if parent_id is not None:
        payload["parent_id"] = parent_id
    resp = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_list_comments_empty(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    resp = await client.get(f"/api/v1/posts/{post_id}/comments")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_top_level_comment(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)

    data = await _create_comment(client, auth_headers, post_id, "Nice post")
    assert data["depth"] == 0
    assert data["parent_id"] is None
    assert data["post_id"] == post_id
    assert data["score"] == 0
    assert data["is_deleted"] is False
    assert data["author"]["id"] == "u-test"
    assert data["author"]["username"] == "test_user"
    assert data["replies"] == []

    post = await session.scalar(select(Post).where(Post.id == post_id))
    assert post is not None
    assert post.comment_count == 1

    listing = (await client.get(f"/api/v1/posts/{post_id}/comments")).json()
    assert len(listing) == 1
    assert listing[0]["id"] == data["id"]


async def test_create_reply_nests_under_parent(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    parent = await _create_comment(client, auth_headers, post_id, "Root")
    reply = await _create_comment(client, auth_headers, post_id, "Reply", parent_id=parent["id"])
    assert reply["depth"] == 1
    assert reply["parent_id"] == parent["id"]

    listing = (await client.get(f"/api/v1/posts/{post_id}/comments")).json()
    assert len(listing) == 1
    assert listing[0]["id"] == parent["id"]
    assert len(listing[0]["replies"]) == 1
    assert listing[0]["replies"][0]["id"] == reply["id"]


async def test_reply_at_max_depth_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    parent_id = (await _create_comment(client, auth_headers, post_id, "depth0"))["id"]
    # Build a chain down to depth 10 (11 comments total).
    for _ in range(10):
        child = await _create_comment(client, auth_headers, post_id, "deeper", parent_id=parent_id)
        parent_id = child["id"]
    # The last comment is at depth 10; replying to it must be rejected.
    resp = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "too deep", "parent_id": parent_id},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_cross_post_parent_returns_400(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_a = await _seed_post(client, auth_headers)
    # Second post in the same community.
    resp_b = await client.post(
        "/api/v1/communities/films/posts",
        json={"title": "Other post", "content": "x"},
        headers=auth_headers,
    )
    assert resp_b.status_code == 201
    post_b = resp_b.json()["id"]

    comment_a = await _create_comment(client, auth_headers, post_a, "on A")
    resp = await client.post(
        f"/api/v1/posts/{post_b}/comments",
        json={"content": "hijack", "parent_id": comment_a["id"]},
        headers=auth_headers,
    )
    assert resp.status_code == 400


async def test_missing_parent_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    resp = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "reply", "parent_id": "no-such-comment"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_missing_post_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/posts/no-such-post/comments",
        json={"content": "hello"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_create_comment_unauthenticated_returns_401(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    resp = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "anon"},
    )
    assert resp.status_code == 401


async def test_comment_ordering(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    first = await _create_comment(client, auth_headers, post_id, "first top-level")
    second = await _create_comment(client, auth_headers, post_id, "second top-level")

    listing = (await client.get(f"/api/v1/posts/{post_id}/comments")).json()
    # Top-level newest-first.
    assert [c["id"] for c in listing] == [second["id"], first["id"]]

    reply_one = await _create_comment(
        client, auth_headers, post_id, "reply one", parent_id=first["id"]
    )
    reply_two = await _create_comment(
        client, auth_headers, post_id, "reply two", parent_id=first["id"]
    )
    listing = (await client.get(f"/api/v1/posts/{post_id}/comments")).json()
    root = next(c for c in listing if c["id"] == first["id"])
    # Replies oldest-first within a thread.
    assert [r["id"] for r in root["replies"]] == [reply_one["id"], reply_two["id"]]


async def test_guest_can_read_comments(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    post_id = await _seed_post(client, auth_headers)
    await _create_comment(client, auth_headers, post_id, "hello world")
    # No Authorization header — public read must work.
    resp = await client.get(f"/api/v1/posts/{post_id}/comments")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_non_member_can_comment(
    client: AsyncClient,
    auth_headers: dict[str, str],
    auth_headers2: dict[str, str],
) -> None:
    # u-test creates the community + post (and is a member); u-test2 is NOT a
    # member but commenting is auth-only, not membership-gated.
    post_id = await _seed_post(client, auth_headers)
    data = await _create_comment(client, auth_headers2, post_id, "outsider comment")
    assert data["author"]["id"] == "u-test2"
