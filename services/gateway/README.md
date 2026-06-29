# Hiver API Gateway

Single public entry point. Routes `/api/v1/*` by path prefix to the Identity or
Content service, applies CORS, and enforces Redis-backed rate limiting. Verifies
nothing about identity itself — each downstream service verifies the JWT.

| Prefix | Target |
|--------|--------|
| `auth`, `users`, `.well-known` | Identity |
| `communities`, `posts`, `comments`, `votes` | Content |

## Local dev

```bash
pip install -e ".[dev]"
export PYTHONPATH=src
export IDENTITY_URL=http://localhost:8001
export CONTENT_URL=http://localhost:8002
# export REDIS_URL=redis://localhost:6379/0   # optional; blank disables rate limiting
uvicorn app.main:app --port 8000
pytest
```

The frontend points at this gateway (`NEXT_PUBLIC_API_URL`, default
`http://localhost:8000`). See [ADR-0002](../../docs/adr/0002-microservices-split.md).
