# Deployment Guide

## 1. Local Development

Prerequisites: Node.js 20+, Docker (for Postgres/Redis) or local Postgres 15+ and Redis 7+.

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env      # only VITE_* vars are read by the web app

npm install                        # installs all workspaces

# Start Postgres + Redis via Docker (recommended)
docker compose -f infra/docker-compose.yml up -d postgres redis

npm run prisma:generate
npm run prisma:migrate             # applies migrations to local DB
npm run prisma:seed                # demo tournaments, admin user, sample players

npm run dev                        # api on :4000, web on :5173
```

Default seeded admin: `admin@cricket-platform.dev` / `Admin@12345` (SUPER_ADMIN) — **rotate immediately in any non-local environment.**

## 2. Full Docker Compose (dev-parity stack)

```bash
docker compose -f infra/docker-compose.yml up --build
```

Brings up: `postgres`, `redis`, `api` (with migrations run on boot via entrypoint), `web` (Vite build served by Nginx). Web on `http://localhost:8080`, API on `http://localhost:4000`, Swagger UI on `http://localhost:4000/docs`.

## 3. Production Deployment

### 3.1 Build artifacts

```bash
docker build -f infra/docker/api.Dockerfile -t cricket-platform/api:$(git rev-parse --short HEAD) .
docker build -f infra/docker/web.Dockerfile -t cricket-platform/web:$(git rev-parse --short HEAD) .
```

Both images are multi-stage: a `build` stage compiles TypeScript / bundles Vite, and a slim `runtime` stage (distroless-ish `node:20-alpine` / `nginx:alpine`) ships only production output — no source, no devDependencies, no build toolchain in the final image.

### 3.2 Managed infrastructure (recommended baseline)

| Concern | Recommendation |
|---|---|
| Postgres | Managed instance (RDS/Cloud SQL/Supabase) with automated backups + PITR, `sslmode=require`. |
| Redis | Managed instance (ElastiCache/Upstash) for OTP + rate-limit state. |
| Object storage | S3 or S3-compatible (R2/MinIO) bucket, private, served via signed URLs for profile photos. |
| Secrets | Never bake into images — inject via platform secret manager (SSM/Secrets Manager/Doppler) at container start. |
| TLS | Terminate at the load balancer/reverse proxy (ALB, Nginx, Caddy, or Cloudflare) — API containers speak plain HTTP behind it. |

### 3.3 `docker-compose.prod.yml`

Use `infra/docker-compose.prod.yml` as a starting point for a single-VM deployment (small tournament orgs). It runs `api` (2 replicas via `deploy.replicas`), `web`, `nginx` (TLS + reverse proxy), and expects `postgres`/`redis` to be **external managed services** referenced by env vars — it does not run its own stateful DB/Redis containers in production.

```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d
```

### 3.4 Database migrations in production

Run migrations as a **separate, one-shot step** before rolling the new API version — never let a race between two API replicas both auto-migrating on boot:

```bash
docker run --rm --env-file .env.production cricket-platform/api:<tag> npx prisma migrate deploy
```

Then roll the API deployment. This is the step your CD pipeline should gate the deploy on.

### 3.5 Zero-downtime rollout

- Run API behind the load balancer with `min_healthy_percent` / rolling update strategy (or blue-green if on ECS/K8s).
- Health check endpoint: `GET /healthz` (liveness — process up) and `GET /readyz` (readiness — DB + Redis reachable).
- Keep access-token TTL short (15m) so a bad deploy is naturally self-healing for session state; refresh tokens are rotated per-use so a compromised one is single-use.

## 4. Environment Variables

See [`.env.example`](../.env.example) at the repo root for the full list. Production must override at minimum: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `STORAGE_DRIVER=s3` + S3 credentials, `SMS_PROVIDER`/`WHATSAPP_PROVIDER` real credentials, `NODE_ENV=production`.

## 5. Observability

- Structured JSON logs (`pino`) to stdout — ship via your platform's log driver (CloudWatch/Loki/Datadog agent).
- `AUDIT_LOG` table is the compliance-grade record; application logs are for operational debugging only, not a substitute.
- Recommended: request-id middleware (`x-request-id`) propagated into logs and returned in the response header for support correlation.

## 6. Backup & DR

- Daily automated Postgres backups (managed-DB default), weekly restore drill.
- Object storage bucket versioning enabled (protects against accidental overwrite of profile photos).
- RPO target: 24h (backup cadence) — tighten to continuous PITR if the managed provider supports it and the org's risk tolerance requires it.
