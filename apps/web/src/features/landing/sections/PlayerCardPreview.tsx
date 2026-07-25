import { QrCode, ShieldCheck } from "lucide-react";

/**
 * Static, decorative preview of the digital player card issued on
 * approval — not real data, just illustrating the product on the hero.
 * Mirrors the real PlayerCard's front face (see features/player-card/),
 * with one deliberate difference: an initials avatar instead of a photo.
 * A photorealistic "Verified Player" mockup on a trust-led product risks
 * being mistaken for a real record — initials read unambiguously as sample data.
 */
export function PlayerCardPreview() {
  return (
    <div className="w-80 rounded-xl border border-white/10 bg-gradient-to-br from-white/20 to-white/5 p-1.5 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="flex flex-col gap-4 rounded-lg bg-pitch p-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-white/70">Player ID</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-gold">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-primary font-display text-base font-bold text-white"
            aria-hidden="true"
          >
            XX
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight text-white">XXXXXXX XXXXX</p>
            <p className="truncate text-xs text-white/60">All-Rounder · Right-hand Bat</p>
          </div>
          <QrCode className="ml-auto h-9 w-9 shrink-0 text-white/30" aria-hidden="true" />
        </div>

        <p className="font-display text-xl font-bold tabular-nums tracking-wide text-white">AVI-XX-XXXXX</p>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60">
          <span>Member since Jul 2026</span>
          <span className="flex items-center gap-1 font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
