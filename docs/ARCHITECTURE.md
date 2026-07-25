# System Architecture

## 1. High-Level Overview

```mermaid
flowchart LR
    subgraph Client["Clients"]
        PWA["Web App (React/Vite)\nPlayer + Admin portals"]
    end

    subgraph Edge["Edge / Gateway"]
        LB["Reverse Proxy (Nginx/Traefik)\nTLS termination, gzip, static cache"]
    end

    subgraph API["API Service (Node.js/Express, Clean Architecture)"]
        HTTP["Interface Layer\nRoutes / Controllers / Middleware"]
        APP["Application Layer\nUse Cases (per module)"]
        DOM["Domain Layer\nEntities, Value Objects, Repository Interfaces"]
        INFRA["Infrastructure Layer\nPrisma Repositories, Providers (SMS/WhatsApp/Storage)"]
    end

    subgraph Data["Data Plane"]
        PG[(PostgreSQL)]
        REDIS[(Redis\nOTP + rate-limit + cache)]
        BLOB[(Object Storage\nS3-compatible: profile photos)]
    end

    subgraph External["External Providers"]
        SMS["SMS Gateway (Twilio/MSG91)"]
        WA["WhatsApp Business API"]
        PAY["Payment Gateway (Razorpay)"]
    end

    PWA -->|HTTPS/JSON| LB --> HTTP
    HTTP --> APP --> DOM
    APP --> INFRA
    INFRA --> PG
    INFRA --> REDIS
    INFRA --> BLOB
    INFRA --> SMS
    INFRA --> WA
    INFRA --> PAY
```

## 2. Clean Architecture Layering (API)

Dependency direction always points **inward**. Outer layers depend on inner layers, never the reverse.

```mermaid
flowchart TD
    I["Interfaces (HTTP)\nExpress routes, controllers, request validation, RBAC guard"]
    A["Application\nUse cases: RegisterPlayer, VerifyOtp, ApprovePlayer, RegisterForTournament, CheckInPlayer..."]
    D["Domain\nEntities (Player, Tournament, Registration), Repository interfaces, Domain errors"]
    F["Infrastructure\nPrisma repository implementations, SmsProvider, WhatsAppProvider, StorageProvider, AuditLogger"]

    I --> A --> D
    F -.implements interfaces from.-> D
    A -->|depends on interfaces only| D
```

- **Domain** has zero framework imports. It defines `PlayerRepository`, `TournamentRepository`, etc. as interfaces (ports).
- **Application** orchestrates use cases using only domain interfaces — fully unit-testable with in-memory fakes, no DB needed.
- **Infrastructure** provides concrete adapters (Prisma-backed repositories, third-party API clients) — swappable without touching application logic.
- **Interfaces/HTTP** is the thinnest layer: parse request → call use case → map result to HTTP response.

## 3. Request Lifecycle (example: Tournament Registration)

```mermaid
sequenceDiagram
    participant U as Player (Browser)
    participant API as Express Route
    participant MW as Middleware (rate-limit, auth, validate)
    participant UC as Use Case
    participant REPO as Repository (Prisma)
    participant DB as PostgreSQL
    participant WA as WhatsApp Provider

    U->>API: POST /auth/otp/request {mobile}
    API->>MW: rate-limit + validate
    MW->>UC: RequestOtpUseCase
    UC->>REPO: save OTP (hashed, TTL)
    REPO->>DB: INSERT otp_challenge
    UC-->>API: 202 Accepted
    U->>API: POST /auth/otp/verify {mobile, code}
    API->>UC: VerifyOtpUseCase
    UC->>REPO: fetch + validate OTP
    UC-->>API: short-lived JWT (player-scoped)
    U->>API: POST /tournaments/:id/register (Bearer JWT)
    API->>MW: authenticate + authorize(PLAYER)
    MW->>UC: RegisterForTournamentUseCase
    UC->>REPO: verify player.status == VERIFIED
    UC->>REPO: create Registration (PENDING_PAYMENT|CONFIRMED)
    REPO->>DB: INSERT registration
    UC->>WA: send confirmation message
    UC-->>API: 201 Created {registration}
```

## 4. Deployment Topology

```mermaid
flowchart TB
    subgraph Internet
        USER[Users]
    end
    subgraph "Docker Host / Cluster"
        NGINX[Nginx reverse proxy + TLS]
        WEB[web container\nstatic build served by Nginx]
        API1[api container #1]
        API2[api container #2]
        REDIS[(redis container)]
    end
    subgraph "Managed Data Services"
        PGPRIM[(PostgreSQL primary)]
        PGREP[(PostgreSQL read replica - optional)]
        S3[(Object storage bucket)]
    end
    USER --> NGINX
    NGINX --> WEB
    NGINX --> API1
    NGINX --> API2
    API1 --> REDIS
    API2 --> REDIS
    API1 --> PGPRIM
    API2 --> PGPRIM
    API1 -.reads.-> PGREP
    API1 --> S3
    API2 --> S3
```

## 5. Key Architectural Decisions (ADR summary)

| Decision | Choice | Rationale |
|---|---|---|
| Language/runtime | TypeScript on Node.js 20 | Single language across FE/BE, shared types package, strong ecosystem for OpenAPI/Prisma tooling. |
| ORM/DB | PostgreSQL + Prisma | Relational integrity for identity uniqueness, migrations-as-code, strong TypeScript types generated from schema. |
| Identity key | Verified mobile number (unique, indexed) | Matches the product requirement directly: "only mobile + OTP for every future registration." |
| Player ID issuance | At **approval** time, not registration time | Prevents ID exhaustion/waste from abandoned or rejected registrations. |
| Auth | JWT access (short TTL) + refresh (rotating, stored hashed) | Stateless horizontal scaling for the API; refresh rotation limits replay risk. |
| Caching/ephemeral state | Redis | OTP challenges, rate-limit counters, and short-lived session data need TTL semantics Postgres doesn't give cheaply. |
| File storage | Local disk (dev) / S3-compatible (prod) behind a `StorageProvider` interface | Decouples business logic from storage vendor; local dev needs zero cloud setup. |
| Messaging | Provider interface (`SmsProvider`, `WhatsAppProvider`) with a `console` dev implementation | Lets the whole registration flow be built/tested without live Twilio/Meta credentials; swap in prod via env var. |
| Architecture style | Clean Architecture + Repository Pattern | Keeps domain rules (uniqueness, verification state machine) testable and framework-agnostic; Prisma is a plug-in, not a foundation. |

## 6. Domain State Machines

### Player verification status

```mermaid
stateDiagram-v2
    [*] --> PENDING_VERIFICATION: profile submitted
    PENDING_VERIFICATION --> CHANGES_REQUESTED: admin requests edits
    CHANGES_REQUESTED --> PENDING_VERIFICATION: player resubmits
    PENDING_VERIFICATION --> VERIFIED: admin approves (Player ID issued)
    PENDING_VERIFICATION --> REJECTED: admin rejects
    REJECTED --> PENDING_VERIFICATION: player appeals/resubmits
    VERIFIED --> SUSPENDED: admin suspends (policy violation, duplicate confirmed)
    SUSPENDED --> VERIFIED: admin reinstates
```

### Tournament registration status

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: fee required
    [*] --> CONFIRMED: no fee required
    PENDING_PAYMENT --> CONFIRMED: payment succeeds
    PENDING_PAYMENT --> CANCELLED: payment fails/timeout
    CONFIRMED --> CHECKED_IN: QR scanned at gate
    CONFIRMED --> CANCELLED: player/admin cancels
    CHECKED_IN --> [*]
```
