import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Menu, Trophy, X } from "lucide-react";
import { ThemeToggle } from "../../../design-system";
import { useFocusTrap } from "../../../design-system/hooks/useFocusTrap";

const NAV_LINKS = [
  { href: "#trust", label: "Why Players Trust Us" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#organizers", label: "For Organizers" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Below `lg` the in-page nav (`<nav aria-label="Section navigation">`) is
 * hidden with no fallback, so this drawer is the only way to reach those
 * sections — and, below `sm`, the only way to reach Organizer Sign In too,
 * since that link is also hidden until `sm`. Traps focus, closes on
 * Escape/backdrop click/link click, restores focus to the hamburger button
 * on close.
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
    <div className="fixed inset-0 z-50 flex justify-end lg:hidden" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        tabIndex={-1}
        className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col border-l border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-display text-lg font-bold">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-sm p-1 text-text-secondary hover:bg-canvas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Section navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-sm px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-canvas hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/admin/login"
            onClick={onClose}
            className="mt-2 rounded-sm border border-border px-3 py-2.5 text-center text-sm font-medium text-text-primary hover:bg-canvas"
          >
            Organizer Sign In
          </Link>
        </nav>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Landing-page-only header: real anchor links to sections that actually
 * exist on this page (no "About" / "Contact" that lead nowhere — a dead nav
 * link is a small trust cut on a product whose whole pitch is trust).
 * Login/Register keep PublicShell's minimal chrome since they're task
 * flows, not a marketing page to navigate around.
 */
export function LandingHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-text-primary">
          <Trophy className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
          Aviyukthas Player Hub
        </Link>

        <nav aria-label="Section navigation" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-text-secondary hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/admin/login"
            className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-canvas sm:inline-flex"
          >
            Organizer Sign In
          </Link>
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-sm p-2 text-text-primary hover:bg-canvas lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
