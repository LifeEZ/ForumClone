import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.community import Community
from app.models.outbox import OutboxEvent
from app.models.post import Post

pytestmark = pytest.mark.anyio

AUTHOR_ID = "u-author"
AUTHOR_USERNAME = "author_user"


async def _seed_post(session: AsyncSession, *, author_id: str = AUTHOR_ID) -> Post:
    community = Community(
        id="c-vote",
        name="votecomm",
        display_name="Vote Community",
        description="for vote tests",
        creator_id=author_id,
    )
    post = Post(
        id="p-vote",
        title="Vote me",
        content="body",
        community_id=community.id,
        author_id=author_id,
        author_username=AUTHOR_USERNAME,
        score=0,
        comment_count=0,
    )
    session.add_all([community, post])
    await session.commit()
    return post


async def _seed_comment(session: AsyncSession, post: Post) -> Comment:
    comment = Comment(
        id="cm-vote",
        content="a comment",
        post_id=post.id,
        author_id=AUTHOR_ID,
        author_username=AUTHOR_USERNAME,
        depth=0,
        score=0,
    )
    session.add(comment)
    await session.commit()
    return comment


async def test_upvote_increases_score_and_writes_outbox(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == {"target_type": "post", "target_id": post.id, "value": 1}

    await session.refresh(post)
    assert post.score == 1

    events = list((await session.execute(select(OutboxEvent))).scalars().all())
    assert len(events) == 1
    assert events[0].recipient_user_id == AUTHOR_ID
    assert events[0].delta == 1
    assert events[0].target_type == "post"
    assert events[0].target_id == post.id
    assert events[0].voter_user_id == "u-test"


async def test_change_vote_emits_delta_two(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": -1},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["value"] == -1

    await session.refresh(post)
    assert post.score == -1

    events = list((await session.execute(select(OutboxEvent))).scalars().all())
    deltas = sorted(e.delta for e in events)
    assert deltas == [-2, 1]


async def test_remove_vote_restores_score(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["value"] == 0

    await session.refresh(post)
    assert post.score == 0

    # delta of the removal event is -1 (undo the prior +1)
    events = list((await session.execute(select(OutboxEvent))).scalars().all())
    assert [e.delta for e in events] == [1, -1]


async def test_user_vote_returned_for_viewer(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    authed = await client.get(f"/api/v1/posts/{post.id}", headers=auth_headers)
    assert authed.status_code == 200
    assert authed.json()["user_vote"] == 1

    guest = await client.get(f"/api/v1/posts/{post.id}")
    assert guest.status_code == 200
    assert guest.json()["user_vote"] == 0


async def test_comment_vote_and_user_vote_in_tree(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    comment = await _seed_comment(session, post)
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "comment", "target_id": comment.id, "value": -1},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    await session.refresh(comment)
    assert comment.score == -1

    tree = await client.get(f"/api/v1/posts/{post.id}/comments", headers=auth_headers)
    assert tree.status_code == 200
    items = tree.json()
    assert items[0]["user_vote"] == -1


async def test_self_vote_rejected(client: AsyncClient, session: AsyncSession, auth_headers) -> None:
    # post authored by the authenticated user (u-test)
    post = await _seed_post(session, author_id="u-test")
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 403


async def test_deleted_target_rejected(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    post = await _seed_post(session)
    post.is_deleted = True
    await session.commit()
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_guest_cannot_vote(client: AsyncClient, session: AsyncSession) -> None:
    post = await _seed_post(session)
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": post.id, "value": 1},
    )
    assert resp.status_code == 401


async def test_missing_target_returns_404(
    client: AsyncClient, session: AsyncSession, auth_headers
) -> None:
    resp = await client.post(
        "/api/v1/votes",
        json={"target_type": "post", "target_id": "does-not-exist", "value": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 404
