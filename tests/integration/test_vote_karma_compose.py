"""Vote → outbox → relay → Identity karma across two running services.

Exercises the full slice-7 path against real containers:
  1. Register author + voter on Identity
  2. Author creates community + post on Content
  3. Voter casts vote on Content (score updates immediately)
  4. Content relay delivers outbox event to Identity /internal/karma
  5. Author karma updates eventually (poll /users/me)

Run (from repo root, stack must be up):
    cd tests/integration && uv sync && uv run pytest -v

Or use the helper script:
    ./scripts/run-compose-integration.sh        # bash
    pwsh scripts/run-compose-integration.ps1    # PowerShell
"""

from __future__ import annotations

import asyncio
import time
from uuid import uuid4

import httpx
import pytest

from conftest import CONTENT_URL, IDENTITY_URL

pytestmark = [pytest.mark.integration]

PASSWORD = "integration-test-password"


def _auth(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


async def _register(
    client: httpx.AsyncClient,
    *,
    username: str,
    email: str,
) -> str:
    resp = await client.post(
        f"{IDENTITY_URL}/api/v1/auth/register",
        json={"username": username, "email": email, "password": PASSWORD},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _me_karma(client: httpx.AsyncClient, access_token: str) -> int:
    resp = await client.get(f"{IDENTITY_URL}/api/v1/users/me", headers=_auth(access_token))
    assert resp.status_code == 200, resp.text
    return int(resp.json()["karma"])


async def _wait_for_karma(
    client: httpx.AsyncClient,
    access_token: str,
    expected: int,
    *,
    timeout_seconds: float = 20.0,
) -> None:
    deadline = time.monotonic() + timeout_seconds
    last = None
    while time.monotonic() < deadline:
        last = await _me_karma(client, access_token)
        if last == expected:
            return
        await asyncio.sleep(0.5)
    raise AssertionError(f"karma never reached {expected} (last={last})")


async def test_vote_updates_score_and_karma_eventually(
    compose_stack: None,
    http: httpx.AsyncClient,
) -> None:
    suffix = uuid4().hex[:8]
    author_name = f"author_{suffix}"
    voter_name = f"voter_{suffix}"
    community_slug = f"vc-{suffix}"  # lowercase alnum + hyphen

    author_token = await _register(
        http,
        username=author_name,
        email=f"{author_name}@integration.hiver",
    )
    voter_token = await _register(
        http,
        username=voter_name,
        email=f"{voter_name}@integration.hiver",
    )

    # Author sets up content.
    create_community = await http.post(
        f"{CONTENT_URL}/api/v1/communities",
        headers=_auth(author_token),
        json={
            "name": community_slug,
            "display_name": f"Vote Community {suffix}",
            "description": "compose integration",
        },
    )
    assert create_community.status_code == 201, create_community.text

    create_post = await http.post(
        f"{CONTENT_URL}/api/v1/communities/{community_slug}/posts",
        headers=_auth(author_token),
        json={"title": "Vote target", "content": "integration test body"},
    )
    assert create_post.status_code == 201, create_post.text
    post_id = create_post.json()["id"]

    assert await _me_karma(http, author_token) == 0

    # Voter upvotes — score is immediate on Content.
    vote_up = await http.post(
        f"{CONTENT_URL}/api/v1/votes",
        headers=_auth(voter_token),
        json={"target_type": "post", "target_id": post_id, "value": 1},
    )
    assert vote_up.status_code == 200, vote_up.text

    post_resp = await http.get(f"{CONTENT_URL}/api/v1/posts/{post_id}")
    assert post_resp.status_code == 200
    assert post_resp.json()["score"] == 1

    # Karma is eventual — relay polls every ~2s.
    await _wait_for_karma(http, author_token, expected=1)

    # Change vote: up → down. Delta -2 on karma; score -2 on post.
    vote_down = await http.post(
        f"{CONTENT_URL}/api/v1/votes",
        headers=_auth(voter_token),
        json={"target_type": "post", "target_id": post_id, "value": -1},
    )
    assert vote_down.status_code == 200, vote_down.text

    post_resp = await http.get(f"{CONTENT_URL}/api/v1/posts/{post_id}")
    assert post_resp.json()["score"] == -1

    await _wait_for_karma(http, author_token, expected=-1)

    # Remove vote — karma back to 0.
    vote_clear = await http.post(
        f"{CONTENT_URL}/api/v1/votes",
        headers=_auth(voter_token),
        json={"target_type": "post", "target_id": post_id, "value": 0},
    )
    assert vote_clear.status_code == 200, vote_clear.text

    post_resp = await http.get(f"{CONTENT_URL}/api/v1/posts/{post_id}")
    assert post_resp.json()["score"] == 0

    await _wait_for_karma(http, author_token, expected=0)
