import type { SVGProps } from "react";

/** Decorative, theme-agnostic line-art used on cricket-branded hero panels — purely visual, not meant to convey information. */

export function CricketBallOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" {...props}>
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2" />
      <path d="M45 30 Q102 100 45 170" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" fill="none" strokeLinecap="round" />
      <path d="M155 30 Q98 100 155 170" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function StumpsOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 110" fill="none" {...props}>
      <rect x="18" y="18" width="7" height="88" rx="3" fill="currentColor" />
      <rect x="76" y="18" width="7" height="88" rx="3" fill="currentColor" />
      <rect x="134" y="18" width="7" height="88" rx="3" fill="currentColor" />
      <rect x="14" y="8" width="70" height="7" rx="3" fill="currentColor" />
      <rect x="78" y="8" width="70" height="7" rx="3" fill="currentColor" />
    </svg>
  );
}
