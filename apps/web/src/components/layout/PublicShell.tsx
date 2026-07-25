import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { ThemeToggle } from "../../design-system";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-text-primary">
            <Trophy className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
            Aviyukthas Player Hub
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} Aviyukthas Player Hub. One identity, every tournament.
      </footer>
    </div>
  );
}
