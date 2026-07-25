# Production Readiness Checklist

## Security
- [ ] All secrets (`JWT_*_SECRET`, DB creds, provider API keys) come from a secret manager, not committed `.env` files.
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are distinct, ≥32 bytes random, rotated on a schedule.
- [ ] Refresh tokens stored **hashed** in DB; rotation-on-use implemented (old token invalidated when a new one is issued).
- [ ] Password hashing uses bcrypt/argon2 with an appropriate cost factor for admin accounts.
- [ ] Rate limiting active on: OTP request, OTP verify, login, all mutating admin endpoints.
- [ ] `NODE_ENV=production` is actually set, and a real `SMS_PROVIDER` (not `console`) is configured — together these guarantee `POST /auth/otp/request` never returns `devCode` in the response (see `RequestOtpUseCase.ts`).
- [ ] File upload: MIME allow-list + magic-byte sniffing + size cap enforced server-side (not just client-side).
- [ ] Uploaded photos served from private storage via short-lived signed URLs, not a public bucket.
- [ ] CORS locked to known origins (no `*` in production).
- [ ] Helmet (or equivalent) security headers enabled: CSP, X-Frame-Options, HSTS, etc.
- [ ] SQL access is 100% via Prisma parameterized queries — no raw string interpolation into `$queryRawUnsafe`.
- [ ] Admin RBAC verified: a `SCANNER` role cannot reach player medical info or player search/export endpoints.
- [ ] Dependency vulnerability scan (`npm audit` / Snyk / Dependabot) wired into CI.
- [ ] `.env*` files are gitignored and were never committed (verify with `git log --all --full-history -- .env`).

## Data & Privacy
- [ ] Medical info field access is logged and restricted to Tournament/Super Admin roles only.
- [ ] Player soft-delete (`deleted_at`) honored everywhere — no hard deletes that would corrupt historical tournament rosters.
- [ ] Data retention policy documented for audit logs and message logs.
- [ ] Emergency contact / medical fields excluded from any bulk export by default (opt-in, admin-only, logged).

## Reliability
- [ ] `GET /healthz` and `GET /readyz` implemented and wired into the orchestrator's health checks.
- [ ] Database migrations run as a gated, one-shot step before rollout (never racing concurrent replicas).
- [ ] Graceful shutdown: in-flight requests drain on `SIGTERM` before process exit.
- [ ] Idempotency: OTP verify and tournament registration endpoints safe to retry (network blips) without double-charging or double-registering.
- [ ] Automated DB backups enabled + at least one restore drill performed.

## Performance
- [ ] Profile photos re-encoded to WebP + capped dimensions server-side on upload (sharp).
- [ ] DB indexes present on: `player.mobile`, `player.player_id`, `registration(player_id, tournament_id)` composite, `registration.qr_token`.
- [ ] Pagination on all list endpoints (players, registrations, audit logs) — no unbounded `SELECT *`.
- [ ] Frontend: code-split by route, images lazy-loaded, Lighthouse mobile score ≥ 90 on the landing page.

## Accessibility & UX
- [ ] Automated axe scan passes with zero critical violations on landing, registration wizard, dashboard, admin queue.
- [ ] Keyboard-only walkthrough completed for: full registration wizard, OTP entry, admin approve/reject.
- [ ] `prefers-reduced-motion` respected across all Framer Motion animations.
- [ ] Dark and light themes both pass contrast checks (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)).

## Testing & CI/CD
- [ ] Unit tests cover all application-layer use cases with in-memory repository fakes.
- [ ] Integration tests cover the full registration → OTP → admin approve → Player ID issuance flow against a real test DB.
- [ ] CI pipeline gates merge on: lint, typecheck, unit tests, integration tests, build.
- [ ] `npm audit` / dependency scan runs in CI, non-blocking-warn at minimum, blocking for criticals.
- [ ] Rollback plan documented (previous image tag redeploy + `prisma migrate` is additive/backward-compatible per release).

## Observability
- [ ] Structured logs shipped to a central sink; `x-request-id` present on every log line and response.
- [ ] Alerting on: OTP delivery failure rate, 5xx rate, DB connection pool saturation, queue/backlog depth for message campaigns.
- [ ] Audit log coverage verified for every state-changing admin action (approve/reject/request-changes/tournament create/publish/bulk message send).

## Launch
- [ ] Seeded demo/test data removed or clearly separated from the production DB.
- [ ] Default seeded admin credentials rotated.
- [ ] Real SMS/WhatsApp provider credentials configured and a live OTP end-to-end test performed.
- [ ] Terms of service / rules-acceptance copy reviewed by tournament organizer/legal stakeholder.
- [ ] Support/escalation contact published for players who fail verification.
