import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

pytestmark = pytest.mark.anyio

TOKEN = "test-internal-token"


@pytest.fixture
def internal_token(monkeypatch):
    monkeypatch.setattr(settings, "internal_token", TOKEN)


async def _seed_user(session: AsyncSession, *, user_id: str = "u-recipient") -> User:
    user = User(
        id=user_id,
        username="recipient",
        email="recipient@example.com",
        password_hash="x",
        karma=0,
    )
    session.add(user)
    await session.commit()
    return user


async def test_apply_karma_increments(
    client: AsyncClient, session: AsyncSession, internal_token
) -> None:
    user = await _seed_user(session)
    resp = await client.post(
        "/internal/karma",
        json={
            "event_id": "e-1",
            "recipient_user_id": user.id,
            "delta": 5,
            "target_type": "post",
            "target_id": "p-1",
            "voter_user_id": "u-voter",
        },
        headers={"X-Hiver-Internal-Token": TOKEN},
    )
    assert resp.status_code == 200
    assert resp.json()["applied"] is True

    await session.refresh(user)
    assert user.karma == 5


async def test_duplicate_event_is_idempotent(
    client: AsyncClient, session: AsyncSession, internal_token
) -> None:
    user = await _seed_user(session)
    payload = {
        "event_id": "e-dup",
        "recipient_user_id": user.id,
        "delta": 3,
        "target_type": "post",
        "target_id": "p-1",
        "voter_user_id": "u-voter",
    }
    first = await client.post(
        "/internal/karma", json=payload, headers={"X-Hiver-Internal-Token": TOKEN}
    )
    assert first.status_code == 200
    assert first.json()["applied"] is True

    second = await client.post(
        "/internal/karma", json=payload, headers={"X-Hiver-Internal-Token": TOKEN}
    )
    assert second.status_code == 200
    assert second.json()["applied"] is False

    await session.refresh(user)
    assert user.karma == 3


async def test_negative_delta_drives_karma_negative(
    client: AsyncClient, session: AsyncSession, internal_token
) -> None:
    user = await _seed_user(session)
    resp = await client.post(
        "/internal/karma",
        json={
            "event_id": "e-neg",
            "recipient_user_id": user.id,
            "delta": -2,
            "target_type": "comment",
            "target_id": "c-1",
            "voter_user_id": "u-voter",
        },
        headers={"X-Hiver-Internal-Token": TOKEN},
    )
    assert resp.status_code == 200
    await session.refresh(user)
    assert user.karma == -2


async def test_missing_token_rejected(
    client: AsyncClient, session: AsyncSession, internal_token
) -> None:
    user = await _seed_user(session)
    resp = await client.post(
        "/internal/karma",
        json={
            "event_id": "e-notok",
            "recipient_user_id": user.id,
            "delta": 1,
            "target_type": "post",
            "target_id": "p-1",
            "voter_user_id": "u-voter",
        },
    )
    assert resp.status_code == 401


async def test_wrong_token_rejected(
    client: AsyncClient, session: AsyncSession, internal_token
) -> None:
    user = await _seed_user(session)
    resp = await client.post(
        "/internal/karma",
        json={
            "event_id": "e-wrong",
            "recipient_user_id": user.id,
            "delta": 1,
            "target_type": "post",
            "target_id": "p-1",
            "voter_user_id": "u-voter",
        },
        headers={"X-Hiver-Internal-Token": "nope"},
    )
    assert resp.status_code == 401
