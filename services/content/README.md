# Hiver Content service

Owns communities, memberships, posts, comments, and votes. Has **no users table** —
it stores cross-service user references as plain ids plus a denormalized author
snapshot (`author_username`, `author_avatar_url`) copied from JWT claims at write
time. Karma is not snapshotted (per-user, changes every vote — shown only on the
author's own profile via Identity). Tokens are verified with Identity's public key
(no DB lookup).

## Endpoints

- `GET /api/v1/communities`, `POST /api/v1/communities` (create — creator auto-joins as first member), `/{name}`, `/{name}/posts` (GET list · POST create text post — members only), `/{name}/join` (POST/DELETE)
- `GET /api/v1/communities/mine` (joined communities, auth)
- `GET /api/v1/posts`, `/{id}`, `/home`
- `comments` / `votes` — slices 6-7 (stubs today)

## Local dev

```bash
pip install -e ".[dev]"
export PYTHONPATH=src
alembic upgrade head
python -m app.seed        # optional demo communities + posts
export IDENTITY_URL=http://localhost:8001
uvicorn app.main:app --port 8002
pytest
```

See [ADR-0002](../../docs/adr/0002-microservices-split.md).
