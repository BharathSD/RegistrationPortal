import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerSummary, AdminUser } from "@cricket-platform/shared";

export interface PlayerSession {
  type: "PLAYER";
  profile: PlayerSummary | null; // null while completing registration
}

export interface AdminSession {
  type: "ADMIN";
  profile: AdminUser;
}

export type Session = PlayerSession | AdminSession;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  session: Session | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

/**
 * Persisted to localStorage for this MVP so a page refresh keeps the user
 * signed in. Production hardening note (see docs/PRODUCTION_CHECKLIST.md):
 * move the refresh token to an httpOnly cookie set by the API instead of
 * client-readable storage, to remove it from XSS blast radius.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      session: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setSession: (session) => set({ session }),
      logout: () => set({ accessToken: null, refreshToken: null, session: null }),
    }),
    { name: "cricket-platform-auth" },
  ),
);
