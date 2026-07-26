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

Default seeded accounts: `admin@aviyukthas.com` / `Admin@12345` (ADMIN) and `scanner@aviyukthas.com` / `Scanner@12345` (SCANNER) — **rotate both immediately in any non-local environment.**

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

## 7. Alternative: Render.com (interim, pre-R2)

A PaaS path for getting real users on the app quickly, before Cloudflare R2 is set up — no self-hosted VM, no code changes from the rest of this guide. Storage is self-hosted MinIO in the interim (see [S3StorageProvider.ts](../apps/api/src/infrastructure/storage/S3StorageProvider.ts) — same S3-compatible code path R2 will use later, so migrating off MinIO afterwards is an env-var change, not a code change).

**The one thing that differs from a normal Render deploy**: Postgres and Redis can be fully private (only the API needs to reach them), but MinIO can't be — profile photos are `<img>` tags the *browser* loads directly, so MinIO must run as a public Render Web Service, not a Private Service.

1. **MinIO — Render Web Service** (not Private), from the `minio/minio` image, start command `server /data --console-address ":9001"`.
   - Attach a persistent **Disk** mounted at `/data` (requires a paid instance type — Render's free tier doesn't support disks).
   - Set `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` to real generated secrets, not the `minioadmin`/`minioadmin` local-dev defaults — this instance is internet-reachable, so weak root credentials would let anyone who finds the URL write/delete objects (anonymous *read* is intentionally public via the bucket policy below; the root credentials are what gate *write* access).
   - Once it's up, run the one-time bucket setup from your own machine against its public URL:
     ```bash
     mc alias set render-minio https://<your-minio-service>.onrender.com <ROOT_USER> <ROOT_PASSWORD>
     mc mb render-minio/cricket-uploads
     mc anonymous set download render-minio/cricket-uploads
     ```

2. **Postgres + Redis** — Render's managed Postgres and Key Value add-ons, kept private.

3. **API — Render Web Service**, built from `infra/docker/api.Dockerfile`. In addition to the usual vars from §4:
   ```
   STORAGE_DRIVER=s3
   S3_ENDPOINT=https://<your-minio-service>.onrender.com
   S3_FORCE_PATH_STYLE=true
   S3_PUBLIC_URL_BASE=https://<your-minio-service>.onrender.com/cricket-uploads
   S3_BUCKET=cricket-uploads
   S3_ACCESS_KEY_ID=<the MinIO root user>
   S3_SECRET_ACCESS_KEY=<the MinIO root password>
   ```
   Wire `npx prisma migrate deploy` as Render's pre-deploy/release command (same one-shot-before-rollout principle as §3.4). Health check on `GET /healthz`.

4. **Web — Render Static Site**, built from `apps/web`, `VITE_API_BASE_URL` pointing at the API service's Render URL.

5. **Before sharing the link with anyone**: rotate the seeded admin/scanner passwords (§1) — they're still the `seed.ts` defaults until you change them.

**Migrating to R2 later**: point `S3_ENDPOINT` at your R2 account endpoint, swap the access key/secret for R2 credentials, update `S3_PUBLIC_URL_BASE` to the R2 public bucket URL (or a custom domain in front of it), and decommission the MinIO service. No application code changes either way.
