import { Card } from "../../../design-system";
import { useAdminPlayers } from "../../../lib/api/admin";
import type { VerificationStatus } from "@cricket-platform/shared";

const FUNNEL_STAGES: { status: VerificationStatus; label: string; color: string }[] = [
  { status: "PENDING_VERIFICATION", label: "Pending", color: "bg-warning" },
  { status: "CHANGES_REQUESTED", label: "Changes requested", color: "bg-warning" },
  { status: "VERIFIED", label: "Verified", color: "bg-success" },
  { status: "REJECTED", label: "Rejected", color: "bg-danger" },
];

function FunnelBar({ status, label, color }: { status: VerificationStatus; label: string; color: string }) {
  const { data } = useAdminPlayers({ status, page: 1, pageSize: 1 });
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-text-secondary">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-border/50">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (data?.total ?? 0) * 4)}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums">{data?.total ?? "—"}</span>
    </div>
  );
}

export function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold">Analytics</h1>
      <Card>
        <h2 className="mb-4 font-display font-semibold">Verification funnel</h2>
        <div className="flex flex-col gap-3">
          {FUNNEL_STAGES.map((s) => (
            <FunnelBar key={s.status} {...s} />
          ))}
        </div>
      </Card>
      <p className="mt-4 text-xs text-text-secondary">
        Deeper analytics (registrations over time, role distribution, revenue) are a natural extension once
        production traffic accumulates — the API's paginated /admin/players and /communications/campaigns endpoints
        already expose everything needed to build them.
      </p>
    </div>
  );
}
