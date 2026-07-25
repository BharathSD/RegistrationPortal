import { Navigate, Route, Routes } from "react-router-dom";
import { PublicShell } from "../components/layout/PublicShell";
import { PlayerShell } from "../components/layout/PlayerShell";
import { AdminShell } from "../components/layout/AdminShell";
import { RequirePlayer, RequireAdmin } from "../lib/rbac/guards";

import { LandingPage } from "../features/landing/LandingPage";
import { PlayerRegistrationWizard } from "../features/player-registration/PlayerRegistrationWizard";
import { LoginPage } from "../features/auth-login/LoginPage";
import { PlayerDashboardPage } from "../features/player-dashboard/PlayerDashboardPage";
import { AdminLoginPage } from "../features/admin/AdminLoginPage";
import { AdminOverviewPage } from "../features/admin/analytics/AdminOverviewPage";
import { AdminAnalyticsPage } from "../features/admin/analytics/AdminAnalyticsPage";
import { VerificationQueuePage } from "../features/admin/verification-queue/VerificationQueuePage";
import { PlayerSearchPage } from "../features/admin/player-search/PlayerSearchPage";
import { DuplicateFlagsPage } from "../features/admin/duplicate-flags/DuplicateFlagsPage";
import { BulkMessagingPage } from "../features/admin/bulk-messaging/BulkMessagingPage";
import { TournamentManagementPage } from "../features/admin/tournament-management/TournamentManagementPage";
import { QrCheckinPage } from "../features/admin/qr-checkin/QrCheckinPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<PublicShell><PlayerRegistrationWizard /></PublicShell>} />
      <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />

      <Route
        path="/dashboard"
        element={
          <RequirePlayer>
            <PlayerShell>
              <PlayerDashboardPage />
            </PlayerShell>
          </RequirePlayer>
        }
      />

      <Route path="/admin/login" element={<PublicShell><AdminLoginPage /></PublicShell>} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminShell>
              <AdminOverviewPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <VerificationQueuePage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/players"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <PlayerSearchPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/duplicates"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <DuplicateFlagsPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/messaging"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <BulkMessagingPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <TournamentManagementPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/checkin"
        element={
          <RequireAdmin roles={["ADMIN", "SCANNER"]}>
            <AdminShell>
              <QrCheckinPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAdmin roles={["ADMIN"]}>
            <AdminShell>
              <AdminAnalyticsPage />
            </AdminShell>
          </RequireAdmin>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
