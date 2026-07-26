import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Pencil, Trophy } from "lucide-react";
import { Button, Card, ConfirmDialog, QueryError, Skeleton } from "../../design-system";
import { StatusBadge } from "../../design-system/components/Badge";
import { useToast } from "../../design-system/components/Toast";
import { ApiError } from "../../lib/api/client";
import { useMyProfile } from "../../lib/api/players";
import { useCancelRegistration, useMyRegistrations, type RegistrationWithTournament } from "../../lib/api/registrations";
import { useTournaments } from "../../lib/api/tournaments";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { PlayerCard } from "../player-card/PlayerCard";
import { RegisterTournamentModal } from "../tournament-registration/RegisterTournamentModal";
import { EditProfileModal } from "./EditProfileModal";
import type { Tournament } from "@cricket-platform/shared";

// A player can back out of a registration before it's locked in by payment
// or the gate — once they're CHECKED_IN, or already CANCELLED, there's
// nothing left to cancel.
const CANCELLABLE_STATUSES = new Set(["PENDING_PAYMENT", "CONFIRMED"]);

export function PlayerDashboardPage() {
  const session = useAuthStore((s) => s.session);
  const isPlayer = session?.type === "PLAYER";
  const { data: player, isLoading, isError: profileError, refetch: refetchProfile } = useMyProfile(isPlayer);
  const {
    data: registrations,
    isLoading: registrationsLoading,
    isError: registrationsError,
    refetch: refetchRegistrations,
  } = useMyRegistrations(isPlayer);
  const isVerified = player?.verificationStatus === "VERIFIED";
  const {
    data: tournaments,
    isLoading: tournamentsLoading,
    isError: tournamentsError,
    refetch: refetchTournaments,
  } = useTournaments("PUBLISHED");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<RegistrationWithTournament | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const cancelRegistration = useCancelRegistration();
  const toast = useToast();

  const registeredTournamentIds = useMemo(
    () => new Set(registrations?.map((r) => r.tournamentId)),
    [registrations],
  );
  const availableTournaments = tournaments?.filter((t) => !registeredTournamentIds.has(t.id));

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelingId(cancelTarget.id);
    try {
      await cancelRegistration.mutateAsync(cancelTarget.id);
      toast.success(`Cancelled your registration for ${cancelTarget.tournament.name}.`);
      setCancelTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setCancelingId(null);
    }
  }

  if (profileError) {
    return <QueryError message="Couldn't load your profile. Please try again." onRetry={refetchProfile} />;
  }

  if (isLoading || !player) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PlayerCard player={player} />

      {player.verificationStatus !== "VERIFIED" && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-sm font-medium">
            <StatusBadge status={player.verificationStatus} />{" "}
            {player.verificationStatus === "PENDING_VERIFICATION" && "Your profile is awaiting admin review."}
            {player.verificationStatus === "CHANGES_REQUESTED" && player.changeRequestNote}
            {player.verificationStatus === "REJECTED" && player.rejectionReason}
          </p>
        </Card>
      )}

      {isVerified && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Trophy className="h-5 w-5 text-gold" /> Register for a Tournament
          </h2>
          {tournamentsError && <QueryError onRetry={refetchTournaments} />}
          {!tournamentsError && tournamentsLoading && <Skeleton className="h-16" />}
          {!tournamentsError && !tournamentsLoading && (!availableTournaments || availableTournaments.length === 0) && (
            <Card className="text-center text-sm text-text-secondary">
              No open tournaments to register for right now — check back soon.
            </Card>
          )}
          {!tournamentsError && (
            <div className="flex flex-col gap-2">
              {availableTournaments?.map((t) => (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {new Date(t.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setSelectedTournament(t)}>
                    Register
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">My Tournaments</h2>
        {registrationsError && <QueryError onRetry={refetchRegistrations} />}
        {!registrationsError && registrationsLoading && <Skeleton className="h-16" />}
        {!registrationsError && !registrationsLoading && (!registrations || registrations.length === 0) && (
          <Card className="text-center text-sm text-text-secondary">You haven't registered for any tournaments yet.</Card>
        )}
        {!registrationsError && (
          <div className="flex flex-col gap-2">
            {registrations?.map((r) => (
              <Card key={r.id} className="flex items-center justify-between gap-3">
                <span className="font-medium">{r.tournament.name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {CANCELLABLE_STATUSES.has(r.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setCancelTarget(r)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Profile summary</h2>
          <Button size="sm" variant="secondary" onClick={() => setEditingProfile(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </Button>
        </div>
        <Card className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-text-secondary">Player Type</span>
          <span>{player.playerType ? player.playerType.replace("_", " ") : "Not yet assigned by admin"}</span>
          <span className="text-text-secondary">Batting / bowling</span>
          <span>
            {player.battingStyle?.replace("_", "-") ?? "—"} · {player.bowlingStyle?.replace(/_/g, " ") ?? "—"}
          </span>
          <span className="text-text-secondary">Location</span>
          <span>
            {player.city}, {player.state}
          </span>
        </Card>
      </div>

      {selectedTournament && (
        <RegisterTournamentModal tournament={selectedTournament} onClose={() => setSelectedTournament(null)} />
      )}
      {editingProfile && <EditProfileModal player={player} onClose={() => setEditingProfile(false)} />}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel registration"
        message={`Cancel your registration for "${cancelTarget?.tournament.name}"? This can't be undone — you'll need to register again if you change your mind.`}
        confirmLabel="Cancel registration"
        cancelLabel="Keep registration"
        variant="danger"
        loading={cancelingId === cancelTarget?.id}
      />
    </div>
  );
}
