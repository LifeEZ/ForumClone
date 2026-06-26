import jwt
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_register_login_me_logout_refresh(client: AsyncClient) -> None:
    register_resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "securepass1"},
    )
    assert register_resp.status_code == 201
    tokens = register_resp.json()
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    assert tokens["refresh_token"]

    me_resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me_resp.status_code == 200
    me = me_resp.json()
    assert me["username"] == "alice"
    assert me["email"] == "alice@example.com"
    assert me["karma"] == 0

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "securepass1"},
    )
    assert login_resp.status_code == 200
    login_tokens = login_resp.json()

    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_tokens["refresh_token"]},
    )
    assert refresh_resp.status_code == 200
    refreshed = refresh_resp.json()
    assert refreshed["refresh_token"] != login_tokens["refresh_token"]

    old_refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_tokens["refresh_token"]},
    )
    assert old_refresh_resp.status_code == 401

    logout_resp = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refreshed["refresh_token"]},
    )
    assert logout_resp.status_code == 204

    after_logout_refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refreshed["refresh_token"]},
    )
    assert after_logout_refresh.status_code == 401


@pytest.mark.anyio
async def test_access_token_is_rs256_with_username_claim(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "claimuser", "email": "claim@example.com", "password": "securepass1"},
    )
    token = resp.json()["access_token"]

    header = jwt.get_unverified_header(token)
    assert header["alg"] == "RS256"
    assert header["kid"]

    claims = jwt.decode(token, options={"verify_signature": False})
    assert claims["username"] == "claimuser"
    assert claims["sub"]


@pytest.mark.anyio
async def test_jwks_published(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/.well-known/jwks.json")
    assert resp.status_code == 200
    keys = resp.json()["keys"]
    assert keys and keys[0]["kty"] == "RSA" and keys[0]["alg"] == "RS256"


@pytest.mark.anyio
async def test_register_duplicate_username(client: AsyncClient) -> None:
    payload = {"username": "bob", "email": "bob@example.com", "password": "securepass1"}
    assert (await client.post("/api/v1/auth/register", json=payload)).status_code == 201

    duplicate = await client.post(
        "/api/v1/auth/register",
        json={"username": "bob", "email": "bob2@example.com", "password": "securepass1"},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "username already taken"


@pytest.mark.anyio
async def test_login_invalid_credentials(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "nobody", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_me_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401
