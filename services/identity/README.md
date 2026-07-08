# Hiver Identity service

Owns users, auth, refresh tokens, and karma. Issues **RS256** access tokens
(with `sub` + `username` claims) and publishes its public key so other services
can verify tokens without calling back.

## Endpoints

- `POST /api/v1/auth/register|login|refresh|logout`
- `GET  /api/v1/users/me`, `GET /api/v1/users/{id}`
- `GET  /api/v1/.well-known/jwks.json`

## Local dev

```bash
pip install -e ".[dev]"
export PYTHONPATH=src
alembic upgrade head
python -m app.seed        # optional demo users
uvicorn app.main:app --port 8001
pytest
```

Leave `JWT_PRIVATE_KEY_PEM` / `JWT_PUBLIC_KEY_PEM` blank locally to auto-generate
an ephemeral keypair. Set both in deployment so tokens survive restarts. See
[ADR-0002](../../docs/adr/0002-microservices-split.md).
