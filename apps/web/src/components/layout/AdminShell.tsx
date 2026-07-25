import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Copy, LayoutDashboard, LogOut, Menu, MessageSquare, ScanLine, ShieldCheck, Trophy, Users, X } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "../../design-system";
import { useFocusTrap } from "../../design-system/hooks/useFocusTrap";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { useLogout } from "../../lib/api/auth";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/verification", label: "Verification Queue", icon: ShieldCheck },
  { to: "/admin/players", label: "Players", icon: Users },
  { to: "/admin/duplicates", label: "Duplicate Flags", icon: Copy },
  { to: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/admin/messaging", label: "Messaging", icon: MessageSquare },
  { to: "/admin/checkin", label: "Check-in", icon: ScanLine },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-canvas",
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

/**
 * Below `sm` the sidebar (AdminShell's `<aside>`) is hidden entirely, so
 * this drawer is the only way to reach 7 of the 8 admin sections on a
 * phone — including Check-in, which is a phone/camera feature. Traps
 * focus, closes on Escape/backdrop click/link click, restores focus to the
 * hamburger button on close.
 */
function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex sm:hidden" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col border-r border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-display text-lg font-bold">Admin</span>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-sm p-1 text-text-secondary hover:bg-canvas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLinks onNavigate={onClose} />
        </nav>
      </div>
    </div>,
    document.body,
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const admin = session?.type === "ADMIN" ? session.profile : undefined;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface sm:flex">
        <div className="border-b border-border p-4 font-display text-lg font-bold">Admin</div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLinks />
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-canvas sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/admin" className="font-display text-sm font-semibold sm:hidden">
              Admin
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {admin && <span className="hidden text-sm text-text-secondary sm:inline">{admin.fullName} · {admin.role}</span>}
            <ThemeToggle />
            <button
              onClick={() => {
                logoutMutation.mutate();
                logout();
                navigate("/admin/login");
              }}
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-canvas"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
