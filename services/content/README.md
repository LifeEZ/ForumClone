# Hiver Content service

Owns communities, memberships, posts, comments, and votes. Has **no users table** —
it stores cross-service user references as plain ids plus a denormalized author
snapshot (`author_username`, `author_avatar_url`) copied from JWT claims at write
time. Karma is not snapshotted (per-user, changes every vote). Votes emit an
outbox event that the relay delivers to Identity's `POST /internal/karma`; Identity
applies the delta — see [ADR-0003](../../docs/adr/0003-karma-via-outbox-and-relay.md).
Tokens are verified with Identity's public key (no DB lookup).

## Endpoints

- `GET /api/v1/communities`, `POST /api/v1/communities` (create — creator auto-joins as first member), `/{name}`, `/{name}/posts` (GET list · POST create text post — members only), `/{name}/join` (POST/DELETE)
- `GET /api/v1/communities/mine` (joined communities, auth)
- `GET /api/v1/posts`, `/{id}`, `/home`
- `POST /api/v1/posts/{id}/comments`, `GET /api/v1/comments/{id}` (filter `?post_id=` / `?parent_id=`) — comments + replies, auth required to create
- `POST /api/v1/posts/{id}/vote` (`{"value": 1|-1|0}`), `GET /api/v1/posts/{id}/vote` — per-user vote state; updates the post's denormalized `score` and emits an outbox event for the karma relay (see [ADR-0003](../../docs/adr/0003-karma-via-outbox-and-relay.md))

## Local dev

```bash
uv sync --extra dev
uv run alembic upgrade head
uv run python -m app.seed   # optional demo communities + posts
export IDENTITY_URL=http://localhost:8001
uv run uvicorn app.main:app --app-dir src --reload --port 8002
uv run pytest
```

See [ADR-0002](../../docs/adr/0002-microservices-split.md).
