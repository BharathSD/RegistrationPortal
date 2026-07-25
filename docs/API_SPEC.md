# API Specification

The full contract lives in [`apps/api/openapi.yaml`](../apps/api/openapi.yaml) (OpenAPI 3.0). When the API is running, it is also served interactively:

- Swagger UI: `GET /docs`
- Raw spec: `GET /openapi.json`

All endpoints are versioned under `/api/v1`. Authentication is JWT bearer (`Authorization: Bearer <accessToken>`), issued either via the player OTP flow (`/auth/otp/verify`) or the admin login flow (`/auth/admin/login`).

## Conventions

- **Errors** follow a single shape:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ { "path": "mobile", "message": "Invalid E.164 number" } ] } }
  ```
- **Pagination** on list endpoints: `?page=1&pageSize=20`, response includes `{ items, page, pageSize, total }`.
- **Idempotency**: `POST /registrations` and `POST /checkin/scan` are safe to retry — a second call with the same inputs returns the existing resource (200) rather than creating a duplicate (enforced by the `(player_id, tournament_id)` unique index and the `CHECKED_IN` status guard, respectively).
- **RBAC**: every admin route declares its minimum role in code (`requireRole(['SUPER_ADMIN','TOURNAMENT_ADMIN'])`); see [ARCHITECTURE.md](./ARCHITECTURE.md) and the middleware in `apps/api/src/interfaces/http/middleware/rbac.ts`.

## Module → route map

| Module | Base path | Auth |
|---|---|---|
| Auth | `/auth/*` | public (OTP request/verify), bearer for refresh |
| Players (self-service) | `/players/*` | player bearer token |
| Admin — Players & Verification | `/admin/players/*`, `/admin/duplicates/*` | admin bearer token (role-gated) |
| Tournaments | `/tournaments/*` | public GET; admin bearer for mutations |
| Registrations | `/registrations/*` | player bearer token |
| Communications | `/communications/*` | admin bearer token |
| Check-in | `/checkin/*` | admin/scanner bearer token |
| Stats | `/stats/*` | player (own) or admin bearer token |

See [ERD.md](./ERD.md) for the underlying data model referenced by every schema in the spec.
