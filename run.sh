#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-command local dev bootstrap for Linux/macOS.
#
# Order of operations:
#   1. Ensure .env files exist (copied from .env.example)
#   2. Ensure Postgres + Redis are reachable — via Docker if available,
#      otherwise via local services (installing them with sudo apt if
#      they're missing; you'll be prompted for your password interactively)
#   3. npm install, prisma generate/migrate/seed
#   4. Start the API (:4000) and web (:5173) dev servers together
#
# Usage: ./run.sh
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}==>${NC} $1"; }
fail()  { echo -e "${RED}==>${NC} $1"; exit 1; }

# ---- 1. env files ----------------------------------------------------------
[ -f .env ] || { cp .env.example .env; info "Created .env from .env.example"; }
[ -f apps/api/.env ] || { cp .env.example apps/api/.env; info "Created apps/api/.env"; }
[ -f apps/web/.env ] || { cp apps/web/.env.example apps/web/.env; info "Created apps/web/.env"; }

# shellcheck disable=SC1091
set -a; source .env; set +a
POSTGRES_USER="${POSTGRES_USER:-cricket_admin}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-change_me_in_production}"
POSTGRES_DB="${POSTGRES_DB:-cricket_platform}"

# ---- 2. Postgres + Redis ---------------------------------------------------
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  info "Docker found — starting postgres + redis via docker compose"
  docker compose -f infra/docker-compose.yml up -d postgres redis
  info "Waiting for Postgres to accept connections..."
  until docker compose -f infra/docker-compose.yml exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
    sleep 1
  done
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
  export REDIS_URL="redis://localhost:6379"
else
  warn "Docker not found/running — falling back to local Postgres/Redis services."

  if ! command -v psql >/dev/null 2>&1; then
    warn "Postgres is not installed. Installing via apt (you'll be prompted for your sudo password)..."
    sudo apt-get update && sudo apt-get install -y postgresql redis-server \
      || fail "Could not install postgresql/redis-server. Install them manually, or install Docker instead, then re-run ./run.sh."
  fi

  info "Ensuring local Postgres + Redis services are running..."
  sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
  sudo systemctl start redis-server 2>/dev/null || sudo service redis-server start 2>/dev/null || true

  # Create the app role/database if they don't already exist (idempotent).
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}' CREATEDB;"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"

  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
  export REDIS_URL="redis://localhost:6379"
fi

# Keep apps/api/.env in sync with whichever DATABASE_URL we ended up using.
grep -q '^DATABASE_URL=' apps/api/.env \
  && sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" apps/api/.env && rm -f apps/api/.env.bak \
  || echo "DATABASE_URL=${DATABASE_URL}" >> apps/api/.env

# ---- 3. install + migrate + seed ------------------------------------------
info "Installing dependencies (npm install)..."
npm install

info "Building shared package..."
npm run build --workspace packages/shared

info "Generating Prisma client..."
npx prisma generate --schema apps/api/prisma/schema.prisma

info "Applying database migrations..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

info "Seeding demo data (admin/organizer/scanner accounts + sample players + a tournament)..."
npm run prisma:seed --workspace apps/api

# ---- 4. start dev servers --------------------------------------------------
info "Starting API on http://localhost:4000 (docs at /docs) and web on http://localhost:5173"
trap 'kill 0' EXIT INT TERM
npm run dev --workspace apps/api &
npm run dev --workspace apps/web &
wait
