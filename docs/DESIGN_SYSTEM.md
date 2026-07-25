# Design System — "Stadium Lights"

An IPL-inspired, premium sports-app aesthetic: saturated floodlit gradients, high-contrast scoreboard typography, and confident motion — but disciplined enough to stay WCAG AA and readable in a dugout at noon.

## 1. Brand Palette

Two accent families evoke a stadium under lights: **cobalt** (primary action, trust) and **amber/gold** (achievement, verified status, Player ID). Both are tuned to pass 4.5:1 contrast against their paired backgrounds in both themes.

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--color-bg-canvas` | `#F7F8FB` | `#0B0F1A` | Page background |
| `--color-bg-surface` | `#FFFFFF` | `#131826` | Cards, sheets |
| `--color-bg-surface-raised` | `#FFFFFF` | `#1B2233` | Modals, popovers |
| `--color-border` | `#E3E6EE` | `#242C40` | Dividers, card borders |
| `--color-text-primary` | `#10131C` | `#F3F5FA` | Headings, body |
| `--color-text-secondary` | `#5B6472` | `#9AA4B8` | Meta, captions |
| `--color-primary-500` | `#1651E0` | `#5B8CFF` | Primary buttons, links |
| `--color-primary-600` | `#0F3FBD` | `#7AA0FF` | Hover/active |
| `--color-accent-gold-500` | `#D69A1F` | `#F2B93E` | Player ID, "Verified" badge, premium accents |
| `--color-success-500` | `#1E9E63` | `#3FCB8A` | Confirmed, verified, paid |
| `--color-warning-500` | `#D6821F` | `#F2A93E` | Pending, changes requested |
| `--color-danger-500` | `#D6392F` | `#F2564C` | Rejected, error |
| `--color-pitch-gradient` | `linear-gradient(135deg, #0B3D2E 0%, #1651E0 100%)` | `linear-gradient(135deg, #06251C 0%, #0B1B4A 100%)` | Hero sections, digital player card back |

Implementation: CSS custom properties on `:root` and `:root[data-theme='dark']`, consumed via Tailwind's `theme.extend.colors` referencing `var(--token)` — one design-token source, two themes, zero duplicated component code.

## 2. Typography

- **Display/headings**: `"Sora", ui-sans-serif` — geometric, confident, scoreboard-adjacent without being a novelty font.
- **Body/UI**: `"Inter", ui-sans-serif` — high legibility at small sizes for dense admin tables.
- **Numeric/stats**: `"Sora"` with `font-variant-numeric: tabular-nums` for Player IDs, stats, countdown timers so digits don't jitter.

Scale (rem, 16px base): `xs 0.75 · sm 0.875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3`.

## 3. Spacing & Radius

- Spacing scale: 4px base unit (`1=4px … 4=16px … 8=32px …`), matches Tailwind defaults for zero custom-config drag.
- Radius: `sm=6px` (inputs, chips), `md=12px` (cards), `lg=20px` (modals, hero panels), `full` (avatars, pills, QR frame corners).
- Elevation via layered shadow + 1px border (not shadow alone) so cards stay legible on OLED-dark surfaces.

## 4. Motion

- Duration tokens: `fast=120ms` (hover/press), `base=200ms` (page transitions, accordions), `slow=320ms` (modal/sheet enter).
- Easing: `standard = cubic-bezier(0.2, 0, 0, 1)` (Material-style decelerate) for entrances; `sharp = cubic-bezier(0.4, 0, 1, 1)` for exits.
- Respect `prefers-reduced-motion`: all Framer Motion variants fall back to opacity-only, no transforms, when the media query matches.
- Signature moment: **Player ID reveal** — on admin approval, the digital card does a 3D flip (front → back with QR) using Framer Motion's `rotateY`, gated behind `prefers-reduced-motion`.

## 5. Core Components (design-system/components)

| Component | Notes |
|---|---|
| `Button` | variants: `primary`, `secondary`, `ghost`, `danger`; sizes `sm/md/lg`; loading state disables + spinner, never layout-shifts. |
| `Card` | `surface` / `raised` / `gradient` (pitch gradient, for hero/ID card). |
| `Input`, `Select`, `RadioCardGroup` | RadioCardGroup used for cricket role / batting style / experience level — large tappable cards, not tiny radio dots (mobile-first). |
| `Stepper` | horizontal on desktop, condensed dot+label on mobile, for the registration wizard. |
| `Badge` | status pills: `Verified` (gold/success), `Pending` (warning), `Rejected` (danger), `Checked-in` (primary). |
| `Modal` / `Sheet` | Modal on desktop, bottom Sheet on mobile for the same dialog content (one component, responsive presentation). |
| `Toast` | optimistic-UI feedback; success/error/info; auto-dismiss with pause-on-hover. |
| `StatTile` | admin analytics KPI cards with sparkline. |
| `PlayerCard` | the digital ID card: front = photo, name, role, Player ID; back = QR + emergency contact snippet. |
| `QrScanner` | camera viewfinder with target reticle, torch toggle, manual-entry fallback for low-light grounds. |
| `Skeleton` | shimmer placeholders matching each card's real layout (no layout shift on load). |

## 6. Accessibility (WCAG AA baseline)

- Color is never the only signal: every status Badge carries an icon + text label.
- All interactive targets ≥ 44×44px (mobile-first tap targets).
- Focus-visible rings on every interactive element (`outline: 2px solid var(--color-primary-500)` offset 2px), never `outline: none` without a replacement.
- Form fields: explicit `<label>`, `aria-describedby` for hints/errors, error text announced via `aria-live="polite"`.
- Modals/sheets trap focus, restore focus to trigger on close, close on `Esc`.
- Contrast: all text/background pairs above verified 4.5:1 (3:1 for large text) in both themes.
- QR scanner ships a manual "enter code" fallback for users who can't/won't grant camera access.

## 7. Dark/Light Mode

- Strategy: `data-theme` attribute on `<html>`, default follows `prefers-color-scheme`, user override persisted in `localStorage`, toggle in the app shell header.
- No component ships hard-coded hex — everything reads CSS variables, so theme switching is instant with no re-render flash (set before first paint via inline script in `index.html`).
