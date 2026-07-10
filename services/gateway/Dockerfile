FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /workspace

COPY packages/auth-contract packages/auth-contract
COPY packages/routing-contract packages/routing-contract
COPY services/gateway/pyproject.toml services/gateway/uv.lock services/gateway/README.md services/gateway/
COPY services/gateway/src services/gateway/src

WORKDIR /workspace/services/gateway
RUN uv sync --frozen --no-dev

ENV PATH="/workspace/services/gateway/.venv/bin:$PATH"
ENV PYTHONPATH=/workspace/services/gateway/src

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
