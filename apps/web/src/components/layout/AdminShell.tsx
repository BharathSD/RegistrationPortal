import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Copy, LayoutDashboard, LogOut, MessageSquare, ScanLine, ShieldCheck, Trophy, Users } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "../../design-system";
import { useAuthStore } from "../../lib/hooks/useAuthStore";

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

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const admin = session?.type === "ADMIN" ? session.profile : undefined;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface sm:flex">
        <div className="border-b border-border p-4 font-display text-lg font-bold">Admin</div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <Link to="/admin" className="font-display text-sm font-semibold sm:hidden">
            Admin
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {admin && <span className="hidden text-sm text-text-secondary sm:inline">{admin.fullName} · {admin.role}</span>}
            <ThemeToggle />
            <button
              onClick={() => {
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
    </div>
  );
}
