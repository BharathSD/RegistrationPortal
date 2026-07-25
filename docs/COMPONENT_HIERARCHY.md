# Frontend Component Hierarchy

```
<App>
├── <ThemeProvider>            (data-theme, localStorage sync, prefers-color-scheme)
├── <QueryClientProvider>       (React Query cache)
├── <AuthProvider>              (JWT access/refresh, current player OR admin session)
└── <RouterProvider>
    │
    ├── PublicShell                          (Navbar + ThemeToggle + Footer)
    │   ├── LandingPage
    │   │   ├── HeroSection (gradient, dual CTA)
    │   │   ├── TournamentListSection
    │   │   │   └── TournamentCard[]
    │   │   └── ValuePropsSection
    │   │
    │   ├── PlayerRegistrationWizard
    │   │   ├── Stepper
    │   │   ├── Step1_MobileEntry            → uses <OtpRequestForm>
    │   │   ├── Step1b_OtpVerify              → <OtpInput>
    │   │   ├── Step2_PersonalInfo            → <PhotoUploader>, <Input>×n
    │   │   ├── Step3_CricketProfile          → <RadioCardGroup>×3, <Select>, <PositionStepper>
    │   │   ├── Step4_LocationEmergencyJersey  → <Input>×n, <MedicalInfoAccordion> (optional)
    │   │   └── Step5_ReviewSubmit            → <SummaryCard>, <SubmitButton optimistic>
    │   │
    │   ├── TournamentRegistrationFlow
    │   │   ├── OtpGate (reuses OtpRequestForm/OtpInput)
    │   │   ├── VerifiedProfileSummary
    │   │   ├── TournamentPicker              → <TournamentCard selectable>
    │   │   ├── RulesAcceptance                → <Checkbox>, <MarkdownViewer>
    │   │   ├── PaymentStep (optional)         → <PaymentWidget>
    │   │   └── ConfirmationScreen             → <PlayerCard preview>
    │   │
    │   └── RegistrationStatusLookup           (check pending/rejected status by mobile+OTP)
    │
    ├── PlayerShell                          (requires PLAYER auth)
    │   └── PlayerDashboard
    │       ├── DigitalPlayerCard             → <QrCode>, flip animation
    │       ├── TournamentHistoryList         → <RegistrationRow>[]
    │       ├── ProfileSummaryPanel           → <EditProfileRequestModal>
    │       └── QuickAction: "Register for a Tournament" → TournamentRegistrationFlow
    │
    └── AdminShell                           (requires ADMIN auth; RequireRole guard)
        ├── AdminSidebarNav
        ├── AdminDashboardHome
        │   ├── KpiRow                        → <StatTile>[]
        │   ├── RegistrationsTrendChart
        │   ├── RoleDistributionChart
        │   └── VerificationFunnelChart
        │
        ├── VerificationQueuePage
        │   ├── FilterBar                     → status / duplicate-flag / search
        │   ├── PlayerQueueTable (virtualized) → <PlayerRow>[]
        │   └── PlayerDetailDrawer
        │       ├── ProfileReadout
        │       ├── DuplicateFlagBanner
        │       ├── MedicalInfoPanel (admin-only)
        │       └── DecisionActions            → Approve / Reject / RequestChanges
        │
        ├── PlayerSearchPage
        │   ├── SearchFilters                  → role, city, verification status, tournament history
        │   └── PlayerResultsTable             → export-to-CSV action
        │
        ├── TournamentManagementPage
        │   ├── TournamentList
        │   ├── TournamentEditor                → create/edit/publish, rules markdown editor
        │   └── TournamentRosterPanel            → registrations, payment status
        │
        ├── BulkMessagingPage
        │   ├── AudienceFilterBuilder
        │   ├── ChannelPicker (SMS/WhatsApp/Email)
        │   ├── TemplateEditor
        │   └── CampaignHistoryTable             → delivery status per message
        │
        ├── QrCheckinPage (role: SCANNER or above)
        │   ├── CameraScanner                    → <QrScanner>
        │   ├── ManualCodeEntryFallback
        │   └── LiveAttendanceCounter
        │
        └── AdminUsersPage (SUPER_ADMIN only)
            └── AdminUserTable                    → role assignment (RBAC)

Shared design-system primitives used throughout:
<Button> <Card> <Input> <Select> <RadioCardGroup> <Checkbox> <Stepper> <Badge>
<Modal> <Sheet> <Toast> <StatTile> <Skeleton> <EmptyState> <ErrorState> <QrCode> <QrScanner>
```

## Composition principles

- **Feature folders own their screens**; `design-system/components` and `components/ui` are the only things a feature is allowed to import from outside itself (no feature-to-feature imports).
- **Shells own layout & auth guarding**; pages inside a shell assume the guard already ran.
- **Every mutating screen** (`Step5_ReviewSubmit`, `DecisionActions`, `RulesAcceptance`→pay→register) uses the shared `useOptimisticMutation` hook: apply the optimistic UI update immediately, roll back and toast on server rejection.
- **Data fetching** lives in `lib/api/*Hooks.ts` (React Query), never inline `fetch` in a component.
