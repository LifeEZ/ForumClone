# Backend

FastAPI API for Hiver.

```bash
cp .env.example .env
uv sync
docker compose -f ../docker-compose.yml up -d
uv run alembic upgrade head
uv run seed
uv run uvicorn app.main:app --reload --app-dir src
```

If you prefer the FastAPI CLI, pass the **file path** (not `app.main:app`):

```bash
uv run fastapi dev src/app/main.py --reload
```

```bash
uv run pytest
uv run ruff check src/ tests/
```
