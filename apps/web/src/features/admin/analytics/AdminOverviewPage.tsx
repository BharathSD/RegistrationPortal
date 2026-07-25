import { AlertTriangle, ShieldCheck, Trophy, Users } from "lucide-react";
import { StatTile } from "../../../design-system";
import { useAdminPlayers } from "../../../lib/api/admin";
import { useDuplicateFlags } from "../../../lib/api/admin";
import { useTournaments } from "../../../lib/api/tournaments";

export function AdminOverviewPage() {
  const { data: allPlayers } = useAdminPlayers({ page: 1, pageSize: 1 });
  const { data: pendingPlayers } = useAdminPlayers({ status: "PENDING_VERIFICATION", page: 1, pageSize: 1 });
  const { data: verifiedPlayers } = useAdminPlayers({ status: "VERIFIED", page: 1, pageSize: 1 });
  const { data: duplicateFlags } = useDuplicateFlags();
  const { data: tournaments } = useTournaments("PUBLISHED");

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total players" value={allPlayers?.total ?? "—"} icon={<Users className="h-5 w-5" />} />
        <StatTile label="Pending verification" value={pendingPlayers?.total ?? "—"} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatTile label="Verified players" value={verifiedPlayers?.total ?? "—"} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatTile label="Live tournaments" value={tournaments?.length ?? "—"} icon={<Trophy className="h-5 w-5" />} />
      </div>
      {duplicateFlags && duplicateFlags.length > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {duplicateFlags.length} open duplicate flag{duplicateFlags.length === 1 ? "" : "s"} need review.
        </div>
      )}
    </div>
  );
}
