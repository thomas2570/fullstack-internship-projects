@echo off
echo ========================================================
echo   Starting AgilePlatform SaaS (Docker 6-Service Stack)
echo ========================================================
docker compose up -d --build
echo.
echo ========================================================
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   Adminer  : http://localhost:8080
echo ========================================================
pause
