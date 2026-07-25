import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { AdminRole } from "@cricket-platform/shared";
import { useAuthStore } from "../hooks/useAuthStore";

/** Gates a route behind a signed-in player (OTP-verified) session. */
export function RequirePlayer({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();
  if (session?.type !== "PLAYER" || !session.profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/** Gates a route behind an admin session, optionally restricted to specific roles (see packages/shared ADMIN_PERMISSIONS). */
export function RequireAdmin({ roles, children }: { roles?: AdminRole[]; children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();
  if (session?.type !== "ADMIN") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(session.profile.role)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
