import { useEffect, type ReactNode } from "react";
import { configureApiClient } from "../../lib/api/client";
import { useAuthStore } from "../../lib/hooks/useAuthStore";

/** Wires the framework-agnostic API client to the zustand auth store exactly once, at app startup. */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    configureApiClient({
      getTokens: () => {
        const { accessToken, refreshToken } = useAuthStore.getState();
        return { accessToken, refreshToken };
      },
      onTokensRefreshed: (accessToken, refreshToken) => {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      },
      onAuthExpired: () => {
        useAuthStore.getState().logout();
      },
    });
  }, []);

  return <>{children}</>;
}
