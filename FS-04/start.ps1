Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting AgilePlatform SaaS (Docker 6-Service Stack)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
docker compose up -d --build
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor Green
Write-Host "  Adminer  : http://localhost:8080" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
