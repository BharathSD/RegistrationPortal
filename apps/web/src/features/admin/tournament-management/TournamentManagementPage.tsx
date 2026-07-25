import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Checkbox, Modal } from "../../../design-system";
import { Input } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useCreateTournament, usePublishTournament, useTournamentRoster, useTournaments } from "../../../lib/api/tournaments";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import type { TournamentInput } from "@cricket-platform/shared";

const EMPTY_FORM: Partial<TournamentInput> = { feeRequired: false, entryFee: 0 };

export function TournamentManagementPage() {
  const { data: tournaments, isLoading } = useTournaments();
  const [creating, setCreating] = useState(false);
  const [rosterTournamentId, setRosterTournamentId] = useState<string | null>(null);
  const publish = usePublishTournament();
  const toast = useToast();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Tournament Management</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New tournament
        </Button>
      </div>

      {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}

      <div className="flex flex-col gap-2">
        {tournaments?.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-text-secondary">
                {t.venue} · {new Date(t.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <Button size="sm" variant="secondary" onClick={() => setRosterTournamentId(t.id)}>
                Roster
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
            </div>
          </Card>
        ))}
      </div>

      {creating && <CreateTournamentModal onClose={() => setCreating(false)} />}
      {rosterTournamentId && <RosterModal tournamentId={rosterTournamentId} onClose={() => setRosterTournamentId(null)} />}
    </div>
  );
}

function CreateTournamentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<Partial<TournamentInput>>(EMPTY_FORM);
  const createTournament = useCreateTournament();
  const toast = useToast();

  function update<K extends keyof TournamentInput>(key: K, value: TournamentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    try {
      await createTournament.mutateAsync(form as TournamentInput);
      toast.success("Tournament created as a draft.");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New tournament"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={createTournament.isPending} onClick={handleCreate}>
            Create draft
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Name" required value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} />
        <Input label="Venue" required value={form.venue ?? ""} onChange={(e) => update("venue", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" required type="date" onChange={(e) => update("startDate", e.target.value as unknown as Date)} />
          <Input label="End date" required type="date" onChange={(e) => update("endDate", e.target.value as unknown as Date)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Registration opens"
            required
            type="datetime-local"
            onChange={(e) => update("registrationOpenAt", e.target.value as unknown as Date)}
          />
          <Input
            label="Registration closes"
            required
            type="datetime-local"
            onChange={(e) => update("registrationCloseAt", e.target.value as unknown as Date)}
          />
        </div>
        <Input label="Max participants" type="number" onChange={(e) => update("maxParticipants", Number(e.target.value))} />
        <Checkbox
          checked={Boolean(form.feeRequired)}
          onChange={(checked) => update("feeRequired", checked)}
          label="Charge an entry fee"
        />
        {form.feeRequired && (
          <Input label="Entry fee (₹)" type="number" value={form.entryFee ?? 0} onChange={(e) => update("entryFee", Number(e.target.value))} />
        )}
      </div>
    </Modal>
  );
}

function RosterModal({ tournamentId, onClose }: { tournamentId: string; onClose: () => void }) {
  const { data: roster, isLoading } = useTournamentRoster(tournamentId);
  return (
    <Modal open onClose={onClose} title="Tournament roster">
      {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
      <div className="flex flex-col gap-2">
        {roster?.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
            <span>
              {r.player.fullName} <span className="text-text-secondary">({r.player.playerId})</span>
            </span>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {!isLoading && roster?.length === 0 && <p className="text-sm text-text-secondary">No registrations yet.</p>}
      </div>
    </Modal>
  );
}
