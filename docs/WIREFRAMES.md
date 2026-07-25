# UI Wireframes (ASCII, mobile-first)

Each block shows the mobile layout first (the constraint that matters most); desktop simply adds columns/whitespace, it never hides content available on mobile.

## 1. Public Landing Page

```
┌─────────────────────────────┐
│  [Logo]           [☾ Theme] │
├─────────────────────────────┤
│   STADIUM-GRADIENT HERO     │
│   "One Identity.            │
│    Every Tournament."       │
│                              │
│  [ Register as Player ]     │  <- primary CTA
│  [ Register for Tournament ]│  <- secondary CTA
├─────────────────────────────┤
│  Live & Upcoming Tournaments │
│  ┌───────────────────────┐  │
│  │ [banner] Name          │ │
│  │ Venue · Dates          │ │
│  │ [Register →]           │ │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ ...card 2              │ │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  Why one identity? (3 icons)│
│  Footer: links, contact     │
└─────────────────────────────┘
```

## 2. Registration Wizard (Player)

```
┌─────────────────────────────┐
│ ← Back      Step 3 of 5      │
│ ●───●───◐───○───○           │  <- Stepper
├─────────────────────────────┤
│ Cricket Profile              │
│                              │
│ Primary role                 │
│ [Batter][Bowler][All-round]  │  <- RadioCardGroup, large tap targets
│ [Wicketkeeper]               │
│                              │
│ Batting style                │
│ ( ) Right-hand ( ) Left-hand │
│                              │
│ Bowling style                │
│ [dropdown]                   │
│                              │
│ Preferred batting position   │
│ [1‑11 stepper]                │
│                              │
│ Experience level              │
│ [Beginner|Intermediate|Adv.] │
├─────────────────────────────┤
│         [ Continue → ]       │
└─────────────────────────────┘
```

Steps: **1** Mobile+OTP → **2** Personal info + photo → **3** Cricket profile → **4** Location + emergency + jersey (+ optional medical, collapsed by default) → **5** Review & submit.

## 3. OTP Screen (shared by registration + tournament entry)

```
┌─────────────────────────────┐
│        Verify your number    │
│                              │
│   We sent a code to          │
│   +91 98••••••10             │
│                              │
│   [_] [_] [_] [_] [_] [_]    │  <- 6 auto-advancing boxes
│                              │
│   Resend code in 00:27        │
│                              │
│        [ Verify ]            │
└─────────────────────────────┘
```

## 4. Player Dashboard

```
┌─────────────────────────────┐
│ Hi, Rohan 👋       [☾][⚙][⎋]│
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  DIGITAL PLAYER CARD    │ │  <- gradient card, tap to flip → QR
│ │  Photo   AVI-000187│ │
│ │  Rohan Sharma  ✅Verified│ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Register for a Tournament →]│
├─────────────────────────────┤
│ My Tournaments                │
│  • Summer T20 Cup  Confirmed  │
│  • Winter League   Checked-in │
├─────────────────────────────┤
│ Profile summary  [Edit →]     │
└─────────────────────────────┘
```

## 5. Tournament Registration (returning player)

```
┌─────────────────────────────┐
│  Enter Mobile → OTP (reuse)  │
├─────────────────────────────┤
│  Welcome back, Rohan Sharma  │  <- fetched, read-only profile summary
│  AVI-000187 · Verified │
├─────────────────────────────┤
│  Select Tournament            │
│  [Summer T20 Cup      ▾]     │
│  Venue · Dates · Fee ₹500     │
├─────────────────────────────┤
│  ☐ I accept the tournament    │
│    rules & code of conduct    │
├─────────────────────────────┤
│      [ Pay & Register ]       │
└─────────────────────────────┘
```

## 6. Admin — Verification Queue

```
┌───────────────────────────────────────────────────┐
│ Admin  ▸ Verification Queue        [☾] [Admin ▾]   │
├───────────┬─────────────────────────────────────────┤
│ Sidebar   │ Filters: [Status ▾][Duplicate flag ▾][🔍]│
│ ▸ Verify  │ ┌───────────────────────────────────────┐│
│ ▸ Players │ │ Photo Rohan Sharma  +91 98••10  2h ago││
│ ▸ Tourns  │ │ ⚠ possible duplicate (name+DOB)       ││
│ ▸ Messages│ │ [View] [Approve] [Reject] [Req.Changes]││
│ ▸ Analytics│└───────────────────────────────────────┘│
│ ▸ Check-in │ ...more rows (virtualized table)         │
└───────────┴─────────────────────────────────────────┘
```

## 7. Admin — Player Detail / Verification Panel

```
┌─────────────────────────────────────────┐
│  ← Back to queue                          │
│  ┌───────────┐  Rohan Sharma               │
│  │  photo    │  +91 98••••••10  · Verified?│
│  └───────────┘  DOB · City, State            │
│  Role: Batter · Right-hand · Pos 3           │
│  Experience: Intermediate                     │
│  Emergency: Meena Sharma (Mother) 98••••20   │
│  Jersey: L, #7 / #11, "R. SHARMA"            │
│  Medical (admin-only): O+, none                │
│  ⚠ Duplicate signal: emergency contact reused │
│    in profile AVI-000041 (View →)       │
├───────────────────────────────────────────┤
│ [ Approve → issues Player ID ]  [ Reject ]   │
│ [ Request changes: ___________ ] [ Send ]    │
└───────────────────────────────────────────┘
```

## 8. Admin — Dashboard / Analytics

```
┌───────────────────────────────────────────┐
│  KPI row: [Total Players][Pending][Verified]│
│           [Tournaments Live][Revenue]        │
├───────────────────────────────────────────┤
│  Registrations over time (line chart)        │
├───────────────────┬───────────────────────┤
│ Role distribution   │ Verification funnel    │
│ (donut)             │ (bar)                   │
└───────────────────┴───────────────────────┘
```

## 9. QR Check-in (Scanner role, tablet/phone)

```
┌─────────────────────────────┐
│  Summer T20 Cup · Gate 1     │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │   camera viewfinder  │   │  <- reticle overlay
│  │        [ ⌐ ⌐ ]        │   │
│  │        [ ⌐ ⌐ ]        │   │
│  └─────────────────────┘    │
│  [ Enter code manually ]     │
├─────────────────────────────┤
│  ✅ Rohan Sharma checked in   │  <- toast, auto-clears
│  142 / 200 checked in         │
└─────────────────────────────┘
```

## 10. Player Digital Card (front / back)

```
FRONT                         BACK
┌───────────────────┐        ┌───────────────────┐
│ STADIUM GRADIENT   │        │  [ QR CODE ]        │
│  ┌────┐  AVI-000187  │  tap  │                     │
│  │photo│  -000187   │  ↻   │  Emergency:          │
│  └────┘             │        │  Meena Sharma        │
│  Rohan Sharma        │        │  +91 98••••••20      │
│  Batter · Pos 3      │        │  Scan to check in /  │
│  ✅ Verified 2026     │        │  verify identity      │
└───────────────────┘        └───────────────────┘
```
