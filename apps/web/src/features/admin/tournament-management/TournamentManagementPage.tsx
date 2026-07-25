import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Tournament } from "@cricket-platform/shared";
import { Button, Card, ConfirmDialog, QueryError } from "../../../design-system";
import { StatusBadge, TimeframeBadge } from "../../../design-system/components/Badge";
import { useDeleteTournament, usePublishTournament, useTournaments } from "../../../lib/api/tournaments";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import { groupTournamentsByTimeframe, type TournamentTimeframe } from "../../../lib/tournamentTimeframe";
import { TournamentFormModal } from "./TournamentFormModal";
import { RosterModal } from "./RosterModal";

const SECTIONS: Array<{ key: TournamentTimeframe; heading: string }> = [
  { key: "ONGOING", heading: "Ongoing" },
  { key: "UPCOMING", heading: "Upcoming" },
  { key: "PAST", heading: "Past" },
];

export function TournamentManagementPage() {
  const { data: tournaments, isLoading, isError, refetch } = useTournaments();
  const [creating, setCreating] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [rosterTournamentId, setRosterTournamentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const publish = usePublishTournament();
  const deleteTournament = useDeleteTournament();
  const toast = useToast();

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteTournament.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = groupTournamentsByTimeframe(tournaments ?? []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Tournament Management</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New tournament
        </Button>
      </div>

      {isError && <QueryError onRetry={refetch} />}

      {!isError && isLoading && <p className="text-sm text-text-secondary">Loading...</p>}

      {!isError && !isLoading && tournaments?.length === 0 && (
        <Card className="text-center text-sm text-text-secondary">
          No tournaments yet — create your first one to start accepting registrations.
        </Card>
      )}

      {!isError &&
        !isLoading &&
        SECTIONS.filter((s) => grouped[s.key].length > 0).map((section) => (
          <div key={section.key} className="mb-6">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-secondary">
              {section.heading} ({grouped[section.key].length})
            </h2>
            <div className="flex flex-col gap-2">
              {grouped[section.key].map((t: Tournament) => (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-text-secondary">
                      {t.venue} · {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimeframeBadge timeframe={section.key} />
                    <StatusBadge status={t.status} />
                    <Button size="sm" variant="secondary" onClick={() => setRosterTournamentId(t.id)}>
                      Roster
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => setEditingTournament(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {t.status === "DRAFT" && (
                      <Button
                        size="sm"
                        loading={publish.isPending}
                        onClick={async () => {
                          try {
                            await publish.mutateAsync(t.id);
                            toast.success("Tournament published.");
                          } catch (err) {
                            if (err instanceof ApiError) toast.error(err.message);
                          }
                        }}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${t.name}`}
                      loading={deletingId === t.id}
                      onClick={() => setDeleteTarget(t)}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

      {creating && <TournamentFormModal onClose={() => setCreating(false)} />}
      {editingTournament && (
        <TournamentFormModal tournament={editingTournament} onClose={() => setEditingTournament(null)} />
      )}
      {rosterTournamentId && <RosterModal tournamentId={rosterTournamentId} onClose={() => setRosterTournamentId(null)} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete tournament"
        message={`Delete "${deleteTarget?.name}"? This permanently removes it and every registration for it. This cannot be undone.`}
        confirmLabel="Delete tournament"
        variant="danger"
        loading={deletingId === deleteTarget?.id}
      />
    </div>
  );
}
