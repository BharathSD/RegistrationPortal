import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Button, Checkbox, ConfirmDialog, Modal } from "../../../design-system";
import { Input, Textarea } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useToast } from "../../../design-system/components/Toast";
import { useAdminAddToRoster, useRemoveFromRoster, useTournamentRoster } from "../../../lib/api/tournaments";
import { useAdminPlayers } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";

/** Who has registered for a tournament, and their confirmation status — reused from Tournament Management and the admin Overview page. */
export function RosterModal({ tournamentId, onClose }: { tournamentId: string; onClose: () => void }) {
  const { data: roster, isLoading } = useTournamentRoster(tournamentId);
  const removeFromRoster = useRemoveFromRoster(tournamentId);
  const toast = useToast();
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    setRemovingId(removeTarget.id);
    try {
      await removeFromRoster.mutateAsync(removeTarget.id);
      toast.success(`${removeTarget.name} removed from the roster.`);
      setRemoveTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal open onClose={onClose} title="Tournament roster">
      <AddVerifiedPlayerToRoster tournamentId={tournamentId} rosterPlayerIds={roster?.map((r) => r.player.id) ?? []} />

      {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
      <div className="flex flex-col gap-2">
        {roster?.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
            <div className="min-w-0">
              <span>
                {r.player.fullName} <span className="text-text-secondary">({r.player.playerId})</span>
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {!r.willingToBowl && (
                  <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-xs text-warning">Not bowling</span>
                )}
                {r.notes && <span className="text-xs text-text-secondary" title={r.notes}>💬 {r.notes}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={r.status} />
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove ${r.player.fullName} from roster`}
                loading={removingId === r.id}
                onClick={() => setRemoveTarget({ id: r.id, name: r.player.fullName })}
              >
                <X className="h-4 w-4 text-danger" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && roster?.length === 0 && <p className="text-sm text-text-secondary">No registrations yet.</p>}
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove from roster"
        message={`Remove ${removeTarget?.name} from this tournament? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removingId === removeTarget?.id}
      />
    </Modal>
  );
}

/**
 * Lets an admin register an already-verified player directly, for players
 * who can't complete self-service tournament registration on their own.
 * Searches VERIFIED players only — that's the same eligibility check the
 * self-service flow enforces server-side, surfaced here so an admin isn't
 * shown someone they can't actually add. Picking a search result opens a
 * small confirm step so the admin can capture the same bowling-availability
 * and notes fields a self-registering player would fill in themselves.
 */
function AddVerifiedPlayerToRoster({ tournamentId, rosterPlayerIds }: { tournamentId: string; rosterPlayerIds: string[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [willingToBowl, setWillingToBowl] = useState(true);
  const [notes, setNotes] = useState("");
  const toast = useToast();
  const addToRoster = useAdminAddToRoster(tournamentId);
  const { data: matches, isFetching } = useAdminPlayers({
    status: "VERIFIED",
    q: q.trim().length >= 2 ? q.trim() : undefined,
    pageSize: 5,
  });

  const results = (matches?.items ?? []).filter((p) => !rosterPlayerIds.includes(p.id));

  function pickPlayer(id: string, name: string) {
    setSelected({ id, name });
    setWillingToBowl(true);
    setNotes("");
  }

  function cancelSelection() {
    setSelected(null);
  }

  async function handleConfirmAdd() {
    if (!selected) return;
    try {
      await addToRoster.mutateAsync({ playerId: selected.id, willingToBowl, notes: notes.trim() || undefined });
      toast.success(`${selected.name} added to the roster.`);
      setQ("");
      setSelected(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  if (selected) {
    return (
      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
        <p className="text-sm font-semibold">Add {selected.name} to the roster</p>
        <Checkbox checked={willingToBowl} onChange={setWillingToBowl} label="Willing to bowl in this tournament" />
        <Textarea
          label="Notes for the organizers (optional)"
          hint="E.g. unavailable on specific days, injury concerns, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={cancelSelection} disabled={addToRoster.isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={addToRoster.isPending} onClick={handleConfirmAdd}>
            <UserPlus className="h-4 w-4" /> Add to roster
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 border-b border-border pb-4">
      <Input
        label="Add a verified player"
        hint="Search by name, mobile, or Player ID — for players who can't register themselves."
        placeholder="Search verified players"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q.trim().length >= 2 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {isFetching && <p className="text-xs text-text-secondary">Searching...</p>}
          {!isFetching &&
            results.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm">
                <span>
                  {p.fullName} <span className="text-text-secondary">({p.playerId} · {p.mobile})</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => pickPlayer(p.id, p.fullName)}>
                  <UserPlus className="h-4 w-4" /> Add
                </Button>
              </div>
            ))}
          {!isFetching && results.length === 0 && (
            <p className="text-xs text-text-secondary">No matching verified players not already on this roster.</p>
          )}
        </div>
      )}
    </div>
  );
}
