FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /workspace

COPY packages/auth-contract packages/auth-contract
COPY packages/routing-contract packages/routing-contract
COPY services/content/pyproject.toml services/content/uv.lock services/content/README.md services/content/
COPY services/content/src services/content/src
COPY services/content/migrations services/content/migrations
COPY services/content/alembic.ini services/content/

WORKDIR /workspace/services/content
RUN uv sync --frozen --no-dev

ENV PATH="/workspace/services/content/.venv/bin:$PATH"
ENV PYTHONPATH=/workspace/services/content/src

EXPOSE 8002

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8002"]
