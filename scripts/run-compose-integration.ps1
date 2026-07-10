# Start identity + content via docker compose and run the cross-service integration test.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> Building and starting identity + content stack..."
docker compose up -d --build identity_db content_db identity content

Write-Host "==> Waiting for services..."
$healthy = $false
for ($i = 1; $i -le 60; $i++) {
    try {
        $id = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 3
        $ct = Invoke-WebRequest -Uri "http://localhost:8002/health" -UseBasicParsing -TimeoutSec 3
        if ($id.StatusCode -eq 200 -and $ct.StatusCode -eq 200) {
            Write-Host "    identity + content healthy"
            $healthy = $true
            break
        }
    } catch {
        # retry
    }
    Start-Sleep -Seconds 2
}
if (-not $healthy) {
    Write-Error "Services did not become healthy in time"
    docker compose logs identity content
    exit 1
}

Write-Host "==> Running integration tests..."
Set-Location tests/integration
uv sync
uv run pytest -v

Write-Host "==> Done. Stack is still running (docker compose down to stop)."
