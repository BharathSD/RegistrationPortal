import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Trophy } from "lucide-react";
import { ThemeToggle } from "../../design-system";
import { useAuthStore } from "../../lib/hooks/useAuthStore";

export function PlayerShell({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const name = session?.type === "PLAYER" ? session.profile?.fullName : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="h-6 w-6 text-gold" aria-hidden="true" />
            {name ? `Hi, ${name.split(" ")[0]}` : "Dashboard"}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-primary hover:bg-canvas"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
