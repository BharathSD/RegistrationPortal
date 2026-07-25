# Cricket Player Identity & Tournament Registration Platform

A player registers once, verifies their identity, and gets a permanent Player ID + digital card with a QR code. Every tournament after that needs only their mobile number and an OTP — no re-entering personal data, no duplicate profiles across leagues.

## What's in this repo

| Doc | Purpose |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product requirements: journeys, personas, functional/non-functional requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, Clean Architecture layering, sequence flows, ADRs |
| [docs/ERD.md](docs/ERD.md) | Entity-relationship diagram and key constraints |
| [docs/API_SPEC.md](docs/API_SPEC.md) · [apps/api/openapi.yaml](apps/api/openapi.yaml) | REST API contract (also served live at `/docs`) |
| [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) | Repo layout and the dependency rule between layers |
| [docs/WIREFRAMES.md](docs/WIREFRAMES.md) | Mobile-first ASCII wireframes for every screen |
| [docs/COMPONENT_HIERARCHY.md](docs/COMPONENT_HIERARCHY.md) | Frontend component tree |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | "Stadium Lights" design system — tokens, motion, accessibility |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local dev, Docker, and production deployment steps |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Pre-launch checklist |

## Stack

- **API** — Node.js 20, TypeScript, Express, PostgreSQL via Prisma, Redis (rate limiting/OTP), JWT auth, Clean Architecture + Repository Pattern.
- **Web** — React 18, TypeScript, Vite, Tailwind CSS, React Query, Zustand, Framer Motion.
- **Shared** — `@cricket-platform/shared`: Zod schemas + types used by both API and web, so validation is defined once.

## Quick start

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm install

docker compose -f infra/docker-compose.yml up -d postgres redis   # or point DATABASE_URL at your own Postgres

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed        # demo admin + players + a published tournament

npm run dev                # api → :4000 (docs at /docs), web → :5173
```

Seeded super admin: `admin@cricket-platform.dev` / `Admin@12345` — see [prisma/seed.ts](apps/api/prisma/seed.ts) for the full seeded dataset (also a tournament admin and a scanner account).

## Testing

```bash
npm run test --workspace apps/api          # unit tests (in-memory fakes, no DB needed)
npm run test:integration --workspace apps/api   # full OTP → verify → tournament flow (needs a migrated DB)
```

## Everything else

Full Docker stack, CI, and production deployment are covered in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Run `docker compose -f infra/docker-compose.yml up --build` for a one-command dev-parity stack (Postgres + Redis + API + web, all containerized).
