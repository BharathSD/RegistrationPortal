import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Pencil, Plus, ShieldCheck, Trash2, Trophy, Users } from "lucide-react";
import type { Tournament } from "@cricket-platform/shared";
import { Button, Card, StatTile } from "../../../design-system";
import { StatusBadge, TimeframeBadge } from "../../../design-system/components/Badge";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import { useAdminPlayers, useDuplicateFlags } from "../../../lib/api/admin";
import { useDeleteTournament, useTournaments } from "../../../lib/api/tournaments";
import { getTournamentTimeframe } from "../../../lib/tournamentTimeframe";
import { TournamentFormModal } from "../tournament-management/TournamentFormModal";
import { RosterModal } from "../tournament-management/RosterModal";

/**
 * What an admin lands on right after logging in. The two things every
 * organizer needs immediately — start a tournament, see who's registered
 * for one — are right here, not one navigation click away in the sidebar.
 */
export function AdminOverviewPage() {
  const { data: allPlayers } = useAdminPlayers({ page: 1, pageSize: 1 });
  const { data: pendingPlayers } = useAdminPlayers({ status: "PENDING_VERIFICATION", page: 1, pageSize: 1 });
  const { data: verifiedPlayers } = useAdminPlayers({ status: "VERIFIED", page: 1, pageSize: 1 });
  const { data: duplicateFlags } = useDuplicateFlags();
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();

  const [creating, setCreating] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [rosterTournamentId, setRosterTournamentId] = useState<string | null>(null);
  const deleteTournament = useDeleteTournament();
  const toast = useToast();

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This permanently removes it and every registration for it. This cannot be undone.`)) return;
    try {
      await deleteTournament.mutateAsync(id);
      toast.success(`${name} deleted.`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Overview</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Create Tournament
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total players" value={allPlayers?.total ?? "—"} icon={<Users className="h-5 w-5" />} />
        <StatTile label="Pending verification" value={pendingPlayers?.total ?? "—"} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatTile label="Verified players" value={verifiedPlayers?.total ?? "—"} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatTile label="Tournaments" value={tournaments?.length ?? "—"} icon={<Trophy className="h-5 w-5" />} />
      </div>

      {duplicateFlags && duplicateFlags.length > 0 && (
        <Link
          to="/admin/duplicates"
          className="mt-6 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 p-4 text-sm hover:bg-warning/10"
        >
          <AlertTriangle className="h-4 w-4 text-warning" />
          {duplicateFlags.length} open duplicate flag{duplicateFlags.length === 1 ? "" : "s"} need review.
          <span className="ml-auto text-xs font-medium text-warning">Review →</span>
        </Link>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your tournaments</h2>
          <Link to="/admin/tournaments" className="text-sm font-medium text-primary">
            Manage all →
          </Link>
        </div>

        {tournamentsLoading && <p className="text-sm text-text-secondary">Loading...</p>}
        {!tournamentsLoading && tournaments?.length === 0 && (
          <Card className="text-center text-sm text-text-secondary">
            No tournaments yet — create your first one to start accepting registrations.
          </Card>
        )}

        <div className="flex flex-col gap-2">
          {tournaments?.slice(0, 5).map((t) => (
            <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-text-secondary">
                  {t.venue} · {new Date(t.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TimeframeBadge timeframe={getTournamentTimeframe(t)} />
                <StatusBadge status={t.status} />
                <Button size="sm" variant="secondary" onClick={() => setRosterTournamentId(t.id)}>
                  Registrations
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => setEditingTournament(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${t.name}`}
                  loading={deleteTournament.isPending}
                  onClick={() => handleDelete(t.id, t.name)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {creating && <TournamentFormModal onClose={() => setCreating(false)} />}
      {editingTournament && (
        <TournamentFormModal tournament={editingTournament} onClose={() => setEditingTournament(null)} />
      )}
      {rosterTournamentId && <RosterModal tournamentId={rosterTournamentId} onClose={() => setRosterTournamentId(null)} />}
    </div>
  );
}
