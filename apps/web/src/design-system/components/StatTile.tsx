import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
}

export function StatTile({ label, value, icon, hint }: StatTileProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
      </div>
      {icon && <div className="rounded-sm bg-primary/10 p-2 text-primary">{icon}</div>}
    </Card>
  );
}
