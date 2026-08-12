# Hiver

Monorepo for **Hiver** — a community discussion platform.

**v1 plan:** [`docs/PLAN-v1.md`](docs/PLAN-v1.md) · **Domain glossary:** [`CONTEXT.md`](CONTEXT.md) · **Architecture decision:** [`docs/adr/0002-microservices-split.md`](docs/adr/0002-microservices-split.md)

## Architecture

A Next.js frontend talks to a single API **gateway**, which routes to two backend services, each owning its own Postgres database. Auth is stateless across services via RS256 JWTs (Identity signs; the others verify with its public key).

```
frontend ─▶ gateway ─┬─▶ identity  ─▶ identity_db
                     └─▶ content   ─▶ content_db
                     (rate limiting ─▶ redis)
```

| Service | Port | Owns |
|---------|------|------|
| `services/gateway` | 8000 | Single entry, routing, CORS, Redis rate limiting |
| `services/identity` | 8001 | Users, auth, refresh tokens, karma; issues RS256 tokens |
| `services/content` | 8002 | Communities, memberships, posts, comments, votes |
| `frontend` | 3000 | Next.js App Router UI |

## Structure

- `services/identity/`, `services/content/`, `services/gateway/` — FastAPI services (each: `src/app/`, tests, Dockerfile; identity/content also have Alembic migrations)
- `frontend/` — Next.js App Router UI
- `docker-compose.yml` — full backend stack (both Postgres DBs, Redis, all three services)
- `.github/workflows/ci.yml` — lint + test, per service

## Run it locally

**1. Start the backend stack** (from the repo root):

```bash
docker compose up --build -d
```

**2. Load demo data** (once):

```bash
docker compose exec identity python -m app.seed
docker compose exec content python -m app.seed
```

**3. Start the frontend** (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` (the frontend defaults to the gateway at `http://localhost:8000`).

Stop everything with `docker compose down` (add `-v` to also wipe the database volumes).

## Develop a single service

Each service runs standalone with [uv](https://docs.astral.sh/uv/):

```bash
cd services/identity            # or content / gateway
uv run --extra dev ruff check .
uv run --extra dev pytest
uv run uvicorn app.main:app --reload --app-dir src --port 8001
```

Identity and content need a database and run their migrations with `uv run alembic upgrade head`. See each service's `README.md` and `.env.example`.

## Status

Slices 1–9 are implemented: guest browsing, full auth, join/leave with personalized home feed, create-community, create text post, comments + replies, votes with eventual karma (outbox relay from Content → Identity), plus CI polish + per-service READMEs + AppContext stub cleanup, deployment.

**Cross-service smoke test** (vote → score → karma relay):

```bash
# bash
./scripts/run-compose-integration.sh

# PowerShell
pwsh scripts/run-compose-integration.ps1
```
