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

/** A batsman mid-stroke, kept intentionally simple (stick-figure line art) so it reads as texture at low opacity, not as a competing illustration. */
export function BatsmanOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 260" fill="none" {...props}>
      <circle cx="100" cy="38" r="19" stroke="currentColor" strokeWidth="3" />
      <path d="M100 57 L96 122" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M96 122 L68 188" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M96 122 L124 196" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M99 78 L58 104" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M99 78 L134 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 104 L36 156" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
