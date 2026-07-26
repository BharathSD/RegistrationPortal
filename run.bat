@echo off
REM ---------------------------------------------------------------------------
REM One-command local dev bootstrap for Windows.
REM
REM Order of operations:
REM   1. Ensure .env files exist (copied from .env.example)
REM   2. Ensure Postgres + Redis are reachable via Docker Desktop
REM      (Windows has no apt equivalent, so Docker is the supported path here
REM      — if you'd rather run Postgres/Redis natively, install them
REM      yourself, point apps\api\.env at them, then re-run this script)
REM   3. npm install, prisma generate/migrate/seed
REM   4. Start the API (:4000) and web (:5173) dev servers, each in its own window
REM
REM Usage: run.bat
REM ---------------------------------------------------------------------------
setlocal enabledelayedexpansion
cd /d "%~dp0"

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  echo [run.bat] Created .env from .env.example
)
if not exist "apps\api\.env" (
  copy /y ".env.example" "apps\api\.env" >nul
  echo [run.bat] Created apps\api\.env
)
if not exist "apps\web\.env" (
  copy /y "apps\web\.env.example" "apps\web\.env" >nul
  echo [run.bat] Created apps\web\.env
)

where docker >nul 2>nul
if errorlevel 1 goto :no_docker
docker info >nul 2>nul
if errorlevel 1 goto :no_docker

echo [run.bat] Docker found — starting postgres + redis via docker compose
docker compose -f infra\docker-compose.yml up -d postgres redis
if errorlevel 1 (
  echo [run.bat] Failed to start postgres/redis containers. Is Docker Desktop running?
  exit /b 1
)

echo [run.bat] Waiting for Postgres to accept connections...
:wait_pg
docker compose -f infra\docker-compose.yml exec -T postgres pg_isready -U cricket_admin >nul 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto :wait_pg
)
goto :db_ready

:no_docker
echo [run.bat] Docker Desktop was not found or is not running.
echo [run.bat] Windows has no apt equivalent, so this script cannot auto-install Postgres/Redis.
echo [run.bat] Options:
echo   1. Install Docker Desktop (https://www.docker.com/products/docker-desktop) and re-run run.bat
echo   2. Install PostgreSQL and Redis natively, then set DATABASE_URL / REDIS_URL
echo      in apps\api\.env yourself before re-running run.bat
exit /b 1

:db_ready
echo [run.bat] Installing dependencies (npm install)...
call npm install
if errorlevel 1 exit /b 1

echo [run.bat] Building shared package...
call npm run build --workspace packages/shared
if errorlevel 1 exit /b 1

echo [run.bat] Generating Prisma client...
call npx prisma generate --schema apps/api/prisma/schema.prisma
if errorlevel 1 exit /b 1

echo [run.bat] Applying database migrations...
call npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
if errorlevel 1 exit /b 1

echo [run.bat] Seeding demo data (admin/organizer/scanner accounts + sample players + a tournament)...
call npm run prisma:seed --workspace apps/api
if errorlevel 1 exit /b 1

echo [run.bat] Starting API on http://localhost:4000 (docs at /docs) and web on http://localhost:5173
start "Cricket Platform API" cmd /k "npm run dev --workspace apps/api"
start "Cricket Platform Web" cmd /k "npm run dev --workspace apps/web"

echo [run.bat] Both dev servers are starting in separate windows. Close those windows to stop them.
endlocal
