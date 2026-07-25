import { useState } from "react";
import { X } from "lucide-react";
import { Button, ConfirmDialog, Modal } from "../../../design-system";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useToast } from "../../../design-system/components/Toast";
import { useRemoveFromRoster, useTournamentRoster } from "../../../lib/api/tournaments";
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
      {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
      <div className="flex flex-col gap-2">
        {roster?.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
            <span>
              {r.player.fullName} <span className="text-text-secondary">({r.player.playerId})</span>
            </span>
            <div className="flex items-center gap-2">
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
