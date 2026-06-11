# Backend

FastAPI API for the Reddit clone.

```bash
cp .env.example .env
uv sync
docker compose -f ../docker-compose.yml up -d
uv run alembic upgrade head
uv run fastapi dev app.main:app --reload
uv run pytest
uv run ruff check src/ tests/
```
