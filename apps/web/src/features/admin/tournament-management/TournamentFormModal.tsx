import { useState } from "react";
import { Button, Checkbox, DatePicker, Modal } from "../../../design-system";
import { Input } from "../../../design-system/components/Field";
import { useCreateTournament, useUpdateTournament } from "../../../lib/api/tournaments";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import type { Tournament, TournamentInput } from "@cricket-platform/shared";

const EMPTY_FORM: Partial<TournamentInput> = { feeRequired: false, entryFee: 0 };

/** ISO instant -> the local wall-clock string a <input type="datetime-local"> expects (browser-local, matching what typing a fresh value into that same input would produce). */
function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toForm(t: Tournament): Partial<TournamentInput> {
  return {
    name: t.name,
    description: t.description ?? undefined,
    venue: t.venue,
    startDate: t.startDate as unknown as Date,
    endDate: t.endDate as unknown as Date,
    registrationOpenAt: toDatetimeLocalValue(t.registrationOpenAt) as unknown as Date,
    registrationCloseAt: toDatetimeLocalValue(t.registrationCloseAt) as unknown as Date,
    maxParticipants: t.maxParticipants ?? undefined,
    entryFee: t.entryFee,
    feeRequired: t.feeRequired,
    rulesMarkdown: t.rulesMarkdown ?? undefined,
  };
}

/**
 * Doubles as both "create" and "edit" — same fields either way, so one form
 * beats keeping two in sync. Reused from both Tournament Management and the
 * admin Overview page.
 */
export function TournamentFormModal({ tournament, onClose }: { tournament?: Tournament; onClose: () => void }) {
  const isEditing = Boolean(tournament);
  const [form, setForm] = useState<Partial<TournamentInput>>(tournament ? toForm(tournament) : EMPTY_FORM);
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const toast = useToast();
  const saving = createTournament.isPending || updateTournament.isPending;

  function update<K extends keyof TournamentInput>(key: K, value: TournamentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      if (tournament) {
        await updateTournament.mutateAsync({ id: tournament.id, changes: form });
        toast.success("Tournament updated.");
      } else {
        await createTournament.mutateAsync(form as TournamentInput);
        toast.success("Tournament created as a draft.");
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdropClick={false}
      title={isEditing ? `Edit ${tournament!.name}` : "New tournament"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            {isEditing ? "Save changes" : "Create draft"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Name" required value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} />
        <Input label="Venue" required value={form.venue ?? ""} onChange={(e) => update("venue", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Start date"
            required
            value={form.startDate ? String(form.startDate).slice(0, 10) : ""}
            onChange={(v) => update("startDate", v as unknown as Date)}
          />
          <DatePicker
            label="End date"
            required
            min={form.startDate ? String(form.startDate).slice(0, 10) : undefined}
            value={form.endDate ? String(form.endDate).slice(0, 10) : ""}
            onChange={(v) => update("endDate", v as unknown as Date)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Registration opens"
            required
            showTime
            value={form.registrationOpenAt ? String(form.registrationOpenAt) : ""}
            onChange={(v) => update("registrationOpenAt", v as unknown as Date)}
          />
          <DatePicker
            label="Registration closes"
            required
            showTime
            min={form.registrationOpenAt ? String(form.registrationOpenAt).slice(0, 10) : undefined}
            value={form.registrationCloseAt ? String(form.registrationCloseAt) : ""}
            onChange={(v) => update("registrationCloseAt", v as unknown as Date)}
          />
        </div>
        <Input
          label="Max participants"
          type="number"
          value={form.maxParticipants ?? ""}
          onChange={(e) => update("maxParticipants", Number(e.target.value))}
        />
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
