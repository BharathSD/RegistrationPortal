# Folder Structure

```
RegistrationPortal/
├── docs/                         # PRD, architecture, ERD, API spec, design system, wireframes, deployment, checklist
├── infra/
│   ├── docker/
│   │   ├── api.Dockerfile
│   │   └── web.Dockerfile
│   ├── docker-compose.yml        # local/dev stack
│   └── docker-compose.prod.yml   # production stack
├── .github/workflows/ci.yml      # lint + typecheck + test + build gate
├── packages/
│   └── shared/                   # framework-free package shared by api + web
│       └── src/
│           ├── types/            # Player, Tournament, Registration domain types + enums
│           ├── schemas/          # Zod schemas (single source of validation truth)
│           └── constants/        # cricket roles, batting/bowling styles, player-id regex, etc.
├── apps/
│   ├── api/                      # Express + TypeScript, Clean Architecture
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── config/           # env loading + validation, constants
│   │   │   ├── domain/
│   │   │   │   ├── entities/         # Player, Tournament, Registration, AdminUser (pure TS)
│   │   │   │   ├── repositories/     # repository *interfaces* (ports)
│   │   │   │   └── errors/           # DomainError hierarchy
│   │   │   ├── application/
│   │   │   │   ├── auth/             # RequestOtp, VerifyOtp, RefreshSession use cases
│   │   │   │   ├── players/          # RegisterPlayer, UpdateProfile, GetPlayerByMobile...
│   │   │   │   ├── admin/            # ApprovePlayer, RejectPlayer, RequestChanges, DetectDuplicates
│   │   │   │   ├── tournaments/      # CreateTournament, ListTournaments, PublishTournament
│   │   │   │   ├── registrations/    # RegisterForTournament, CancelRegistration
│   │   │   │   ├── communications/   # SendCampaign, SendTransactionalMessage
│   │   │   │   ├── checkin/          # CheckInPlayer, GetAttendanceRoster
│   │   │   │   └── stats/            # RecordMatchStat, GetPlayerStats
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma/           # PrismaClient singleton + repository implementations
│   │   │   │   ├── providers/        # SmsProvider, WhatsAppProvider, PaymentProvider (+ console/dev impls)
│   │   │   │   └── storage/          # StorageProvider (local disk / S3) + image optimizer (sharp)
│   │   │   ├── interfaces/http/
│   │   │   │   ├── routes/           # one router per module, mounted under /api/v1
│   │   │   │   ├── controllers/      # thin: parse → call use case → respond
│   │   │   │   ├── middleware/       # auth, rbac, rateLimiter, auditLogger, errorHandler, validateRequest
│   │   │   │   └── validators/       # Zod request schemas per route
│   │   │   ├── jobs/                 # scheduled/background tasks (OTP cleanup, audit retention)
│   │   │   ├── app.ts                # Express app assembly (middleware + routes), exported for tests
│   │   │   └── server.ts             # process entrypoint (listen)
│   │   └── test/
│   │       ├── unit/                 # application/domain layer, no DB
│   │       └── integration/          # supertest against app.ts + test DB
│   └── web/                          # React + Vite + TypeScript + Tailwind
│       └── src/
│           ├── app/                  # router, providers (QueryClient, Theme, Auth)
│           ├── design-system/
│           │   ├── tokens/           # color, spacing, typography, motion tokens (light+dark)
│           │   └── components/       # Button, Card, Input, Badge, Modal, Stepper, Toast, StatTile...
│           ├── components/
│           │   ├── ui/               # composed, app-specific UI (PlayerCard, QrCode, StatusBadge)
│           │   ├── layout/           # AppShell, PublicShell, AdminShell, Navbar, Sidebar
│           │   └── feedback/         # EmptyState, ErrorState, Skeletons
│           ├── features/
│           │   ├── landing/
│           │   ├── auth-otp/
│           │   ├── player-registration/   # multi-step wizard
│           │   ├── player-dashboard/
│           │   ├── tournament-registration/
│           │   ├── player-card/           # digital ID card + QR
│           │   └── admin/
│           │       ├── verification-queue/
│           │       ├── player-search/
│           │       ├── bulk-messaging/
│           │       ├── analytics/
│           │       ├── tournament-management/
│           │       └── qr-checkin/
│           ├── lib/
│           │   ├── api/              # typed API client (fetch wrapper + React Query hooks)
│           │   ├── hooks/            # useTheme, useAuth, useDebounce...
│           │   ├── rbac/             # <RequireRole> guard, permission map
│           │   └── utils/
│           └── styles/               # tailwind.css, global resets
├── package.json                      # npm workspaces root
└── .env.example
```

## Layering rule of thumb (API)

`interfaces` → `application` → `domain` ← `infrastructure`

A file under `domain/` may **never** `import` anything from `infrastructure/` or `interfaces/`. If a domain file needs the database, it depends on an interface defined in `domain/repositories/`, and `infrastructure/prisma/` supplies the implementation, wired up in `app.ts` (composition root).
