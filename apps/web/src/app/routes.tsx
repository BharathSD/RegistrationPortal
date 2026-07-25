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
import { BulkMessagingPage } from "../features/admin/bulk-messaging/BulkMessagingPage";
import { TournamentManagementPage } from "../features/admin/tournament-management/TournamentManagementPage";
import { QrCheckinPage } from "../features/admin/qr-checkin/QrCheckinPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicShell><LandingPage /></PublicShell>} />
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

      <Route path="/admin/login" element={<AdminLoginPage />} />
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
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN"]}>
            <AdminShell>
              <VerificationQueuePage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/players"
        element={
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN"]}>
            <AdminShell>
              <PlayerSearchPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/messaging"
        element={
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN"]}>
            <AdminShell>
              <BulkMessagingPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN"]}>
            <AdminShell>
              <TournamentManagementPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/checkin"
        element={
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN", "SCANNER"]}>
            <AdminShell>
              <QrCheckinPage />
            </AdminShell>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAdmin roles={["SUPER_ADMIN", "TOURNAMENT_ADMIN"]}>
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
