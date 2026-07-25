import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-sm bg-border/60", className)} aria-hidden="true" />;
}
