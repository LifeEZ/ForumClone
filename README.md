# Hiver

Monorepo for **Hiver** — a community discussion platform (portfolio demo).

**v1 plan:** [`docs/PLAN-v1.md`](docs/PLAN-v1.md) · **Domain glossary:** [`CONTEXT.md`](CONTEXT.md)

## Structure

- `backend/` — FastAPI API (`src/app/`), tests, migrations, Alembic
- `frontend/` — Next.js App Router UI
- `docker-compose.yml` — Postgres for local development

## Backend

```bash
cd backend
cp .env.example .env
uv sync
docker compose -f ../docker-compose.yml up -d
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
