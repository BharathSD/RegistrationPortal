# Product Requirements Document — Cricket Player Identity & Tournament Registration Platform

## 1. Vision

A player proves who they are **once**. Every tournament after that is a 30-second, mobile-number-plus-OTP flow that pulls their verified profile forward. Organizers get one clean, de-duplicated player registry across every league and tournament they run, instead of re-collecting the same data (and re-committing the same data-entry mistakes) every season.

## 2. Problem Statement

Grassroots and semi-pro cricket tournaments today each run their own registration form. Consequences:
- Players re-enter identical personal/medical/emergency data for every tournament.
- Organizers cannot detect the same player registering under slightly different names/numbers (duplicate identities).
- No cross-tournament statistics or verified history follows the player.
- Verification (age, contact, photo) is either skipped or manually redone every time.

## 3. Goals / Non-Goals

**Goals**
- One-time identity verification per player, reusable across unlimited tournaments/leagues.
- OTP-authenticated mobile number as the durable identity key.
- Admin-controlled verification workflow with duplicate detection.
- Permanent, human-shareable Player ID + digital player card with QR code.
- Fast, low-friction tournament registration for already-verified players.
- Foundational statistics model so future scoring/stats features have somewhere to attach.

**Non-Goals (v1)**
- Live scoring / ball-by-ball commentary.
- Payment settlement/payout to organizers (only fee *collection* is in scope).
- Public player leaderboards (data model supports it; UI is out of scope for v1).
- Native mobile apps (v1 is a responsive PWA-grade web app).

## 4. Primary Personas

| Persona | Needs |
|---|---|
| **Player** | Register once, get verified fast, re-register for new tournaments in under a minute, carry a digital ID card. |
| **Tournament Admin** | Verify identities confidently, spot duplicates, manage tournament rosters, message players in bulk, check players in on match day via QR. |
| **Super Admin** | Manage admins/roles, view cross-tournament analytics, audit trail of all sensitive actions. |
| **Scanner/Volunteer** (limited role) | Scan player QR codes at the gate to mark attendance — nothing else. |

## 5. Core User Journeys

### 5.1 Player Registration (one-time)
1. Enter mobile number.
2. Verify via OTP (SMS).
3. Complete profile: personal info, cricket role/skills, batting/bowling style, preferred batting position, experience level, location, emergency contact, jersey preference, profile photo, optional medical info.
4. Submit → status `PENDING_VERIFICATION`.
5. Admin reviews → **Approve** (generates permanent Player ID + digital card + QR, sends WhatsApp confirmation), **Reject** (with reason), or **Request Changes** (player edits and resubmits).

### 5.2 Tournament Registration (repeat, verified players)
1. Enter mobile number.
2. Verify via OTP.
3. System fetches the existing verified profile (no re-entry).
4. Player selects a tournament, reviews eligibility/rules, accepts terms.
5. Optional fee payment.
6. Confirmation sent (WhatsApp/SMS/email) with match-day QR check-in reference.

### 5.3 Admin Verification & Duplicate Detection
- Queue of pending players, sorted oldest-first with SLA highlighting.
- Duplicate signals: exact mobile match (blocked at DB level — mobile is unique), fuzzy name+DOB match, same emergency contact number reused across profiles, same photo hash.
- Admin can merge/flag/reject on duplicate signal.

### 5.4 Match-Day Check-In
- Volunteer scans player's QR (from digital card or SMS/WhatsApp link) at the ground.
- System validates: player is registered for *this* tournament, not already checked in, registration is confirmed (fee paid if required).
- Marks attendance with timestamp + device/operator id for audit.

## 6. Functional Requirements by Module

1. **Public landing page** — value proposition, "Register as Player" / "Register for a Tournament" CTAs, live tournament list, brand-grade visuals.
2. **Player registration** — multi-step wizard, resumable, optimistic client-side validation mirrored server-side.
3. **OTP verification** — mobile-based, rate-limited, expiring, resend cooldown, provider-agnostic (console in dev, Twilio/MSG91 in prod).
4. **Admin verification workflow** — approve/reject/request-changes, reason codes, duplicate flags, SLA tracking.
5. **Permanent Player ID generation** — human-readable format (see §8), immutable once issued.
6. **Player dashboard** — profile summary, verification status, digital card + QR, tournament history, edit-profile request flow.
7. **Tournament registration** — browse open tournaments, eligibility rules, rules acceptance, optional payment, confirmation.
8. **Admin dashboard** — KPIs, verification queue, tournament rosters, analytics charts.
9. **Communication center** — templated SMS/WhatsApp/email, bulk send to filtered player segments, delivery log.
10. **QR-based check-in** — camera-based scanner UI, attendance ledger per tournament.
11. **Statistics foundation** — schema + API for per-player, per-tournament match participation stats (runs/wickets fields reserved for future scoring integration).
12. **Role-based access control** — `SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `SCANNER`, `PLAYER` roles with scoped permissions.

## 7. Player Profile Data Model (functional view)

- **Personal**: full name, date of birth, gender, mobile (verified, unique), email (optional), profile photo.
- **Cricket profile**: primary role (Batter/Bowler/All-rounder/Wicketkeeper), batting style (Right/Left-hand), bowling style (Pace/Spin sub-types), preferred batting position (1–11), experience level (Beginner/Intermediate/Advanced/Professional).
- **Location**: city, state, country, pincode.
- **Emergency contact**: name, relationship, phone.
- **Jersey preferences**: size, preferred number (1st/2nd choice), name on jersey.
- **Medical (optional)**: blood group, allergies, conditions, medication — visible only to Tournament Admins on a need-to-know basis, never to Scanners.
- **System fields**: player ID, verification status, verified-at, verified-by, created/updated timestamps, soft-delete flag.

## 8. Player ID Format

`CKT-<STATE_CODE>-<YY>-<SEQ6>` e.g. `CKT-KA-26-000master187` → concretely `CKT-KA-26-000187`. Immutable, globally unique, generated only at approval time (never at registration time), so rejected/abandoned registrations never burn an ID.

## 9. Non-Functional Requirements

- Clean Architecture with Repository Pattern (domain logic independent of Prisma/Express).
- REST API, versioned (`/api/v1`), documented with OpenAPI 3.0 + Swagger UI.
- JWT access + refresh tokens, short-lived access token, rotating refresh token.
- Full audit log of all state-changing admin actions (who/what/when/before-after).
- Optimistic UI on the client for non-critical mutations (e.g. profile edits) with rollback on failure.
- Server-side validation (Zod) mirrored on the client — client validation is UX, server validation is the source of truth.
- Rate limiting: global + endpoint-specific (OTP send/verify are the tightest).
- Image optimization: server-side resize/re-encode (WebP) + size cap on profile photo upload.
- Secure file uploads: MIME allow-list, magic-byte sniffing, size caps, randomized storage keys, private bucket + signed URLs in production.
- Dockerized services with `docker-compose` for local/dev and a hardened prod compose file.
- CI-ready: lint, typecheck, unit + integration tests gate merges.
- WCAG AA accessibility, dark/light themes, mobile-first responsive layout.

## 10. Success Metrics

- < 60s median time to complete a repeat tournament registration.
- < 5% duplicate-identity rate post-launch (down from unmeasured/likely-high baseline).
- > 95% OTP delivery success within 30s (provider-dependent, monitored).
- 100% of admin state-changing actions present in the audit log.

## 11. Out of Scope / Future Work

- Native apps, push notifications.
- Live scoring integration (stats schema is forward-compatible).
- Payout/settlement to organizers.
- Public player leaderboard/portfolio pages.
