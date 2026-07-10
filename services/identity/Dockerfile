FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /workspace

COPY packages/auth-contract packages/auth-contract
COPY packages/routing-contract packages/routing-contract
COPY services/identity/pyproject.toml services/identity/uv.lock services/identity/README.md services/identity/
COPY services/identity/src services/identity/src
COPY services/identity/migrations services/identity/migrations
COPY services/identity/alembic.ini services/identity/

WORKDIR /workspace/services/identity
RUN uv sync --frozen --no-dev

ENV PATH="/workspace/services/identity/.venv/bin:$PATH"
ENV PYTHONPATH=/workspace/services/identity/src

EXPOSE 8001

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8001"]
