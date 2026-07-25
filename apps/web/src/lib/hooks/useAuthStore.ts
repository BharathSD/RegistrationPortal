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
  session: Session | null;
  setTokens: (accessToken: string) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

/**
 * The refresh token is no longer handled here at all — the API sets it as
 * an httpOnly cookie (see apps/api/src/interfaces/http/cookies.ts), so it's
 * never readable by JS and never touches localStorage. Only the short-lived
 * access token is persisted, so a page refresh keeps the user signed in
 * without keeping the long-lived credential in the XSS blast radius.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      session: null,
      setTokens: (accessToken) => set({ accessToken }),
      setSession: (session) => set({ session }),
      logout: () => set({ accessToken: null, session: null }),
    }),
    { name: "cricket-platform-auth" },
  ),
);
