import { CricketBallOutline, StumpsOutline } from "./CricketDecor";

/**
 * Shared decorative background for cricket-branded hero panels: a faint
 * mowed-pitch stripe texture, a pulsing floodlight glow, and cricket
 * ball/stumps line-art. Purely visual (aria-hidden) — render it as the
 * first child of a `relative overflow-hidden` (or `isolate`) container and
 * keep real content in a `relative z-10` wrapper above it.
 */
export function StadiumBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* mowed-pitch stripes */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(100deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_2px,transparent_2px,transparent_42px)]" />
      <div className="absolute -right-24 -top-24 h-80 w-80 animate-pulse rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <CricketBallOutline className="absolute -bottom-10 -right-10 h-64 w-64 rotate-12 text-white/10" />
      <StumpsOutline className="absolute bottom-8 left-8 h-20 w-20 text-gold/20" />
    </div>
  );
}
