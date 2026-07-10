#!/usr/bin/env bash
# Start identity + content via docker compose and run the cross-service integration test.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building and starting identity + content stack..."
docker compose up -d --build identity_db content_db identity content

echo "==> Waiting for services..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8001/health >/dev/null && curl -sf http://localhost:8002/health >/dev/null; then
    echo "    identity + content healthy"
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "ERROR: services did not become healthy in time" >&2
    docker compose logs identity content
    exit 1
  fi
  sleep 2
done

echo "==> Running integration tests..."
cd tests/integration
uv sync
uv run pytest -v

echo "==> Done. Stack is still running (docker compose down to stop)."
