import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import type { Tournament } from "@cricket-platform/shared";
import { Button, Checkbox, Modal } from "../../design-system";
import { Textarea } from "../../design-system/components/Field";
import { useRegisterForTournament } from "../../lib/api/registrations";
import { useToast } from "../../design-system/components/Toast";
import { ApiError } from "../../lib/api/client";

/**
 * Registering for a tournament from inside the dashboard: the player is
 * already authenticated (they logged in once), so this is just "accept
 * rules, confirm" — no mobile/OTP re-entry. That re-entry only ever
 * happens at /login, not per-tournament.
 */
export function RegisterTournamentModal({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [willingToBowl, setWillingToBowl] = useState(true);
  const [notes, setNotes] = useState("");
  const registerForTournament = useRegisterForTournament();
  const toast = useToast();

  async function handleRegister() {
    try {
      await registerForTournament.mutateAsync({
        tournamentId: tournament.id,
        rulesAccepted: true,
        willingToBowl,
        notes: notes.trim() || undefined,
      });
      toast.success(
        tournament.feeRequired
          ? "Registered — your spot is reserved pending payment."
          : "You're registered! A confirmation has been sent to your mobile.",
      );
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Modal open onClose={onClose} title={tournament.name}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <MapPin className="h-4 w-4" /> {tournament.venue}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <CalendarDays className="h-4 w-4" />
          {new Date(tournament.startDate).toLocaleDateString()} – {new Date(tournament.endDate).toLocaleDateString()}
        </div>
        <p className="text-sm font-medium">{tournament.feeRequired ? `₹${tournament.entryFee} entry fee` : "Free entry"}</p>

        {tournament.rulesMarkdown && (
          <div className="max-h-40 overflow-y-auto rounded-sm border border-border bg-canvas p-3 text-xs text-text-secondary whitespace-pre-wrap">
            {tournament.rulesMarkdown}
          </div>
        )}

        <Checkbox checked={willingToBowl} onChange={setWillingToBowl} label="I'm willing to bowl in this tournament" />

        <Textarea
          label="Notes for the organizers (optional)"
          hint="E.g. unavailable on specific days, injury concerns, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Checkbox
          checked={rulesAccepted}
          onChange={setRulesAccepted}
          label="I accept the tournament rules and code of conduct"
        />

        <Button size="lg" disabled={!rulesAccepted} loading={registerForTournament.isPending} onClick={handleRegister}>
          {tournament.feeRequired ? `Pay ₹${tournament.entryFee} & Register` : "Confirm registration"}
        </Button>
      </div>
    </Modal>
  );
}
