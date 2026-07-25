import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { Button, Card, Skeleton } from "../../design-system";
import { StatusBadge } from "../../design-system/components/Badge";
import { useMyProfile } from "../../lib/api/players";
import { useMyRegistrations } from "../../lib/api/registrations";
import { useTournaments } from "../../lib/api/tournaments";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { PlayerCard } from "../player-card/PlayerCard";
import { RegisterTournamentModal } from "../tournament-registration/RegisterTournamentModal";
import type { Tournament } from "@cricket-platform/shared";

export function PlayerDashboardPage() {
  const session = useAuthStore((s) => s.session);
  const isPlayer = session?.type === "PLAYER";
  const { data: player, isLoading } = useMyProfile(isPlayer);
  const { data: registrations, isLoading: registrationsLoading } = useMyRegistrations(isPlayer);
  const isVerified = player?.verificationStatus === "VERIFIED";
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments("PUBLISHED");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const registeredTournamentIds = useMemo(
    () => new Set(registrations?.map((r) => r.tournamentId)),
    [registrations],
  );
  const availableTournaments = tournaments?.filter((t) => !registeredTournamentIds.has(t.id));

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
          {tournamentsLoading && <Skeleton className="h-16" />}
          {!tournamentsLoading && (!availableTournaments || availableTournaments.length === 0) && (
            <Card className="text-center text-sm text-text-secondary">
              No open tournaments to register for right now — check back soon.
            </Card>
          )}
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
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">My Tournaments</h2>
        {registrationsLoading && <Skeleton className="h-16" />}
        {!registrationsLoading && (!registrations || registrations.length === 0) && (
          <Card className="text-center text-sm text-text-secondary">You haven't registered for any tournaments yet.</Card>
        )}
        <div className="flex flex-col gap-2">
          {registrations?.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <span className="font-medium">{r.tournament.name}</span>
              <StatusBadge status={r.status} />
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Profile summary</h2>
        <Card className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-text-secondary">Role</span>
          <span>{player.cricketRole ? player.cricketRole.replace("_", " ") : "Not yet assigned by admin"}</span>
          <span className="text-text-secondary">Location</span>
          <span>
            {player.city}, {player.state}
          </span>
          <span className="text-text-secondary">Experience</span>
          <span>{player.experienceLevel ?? "Not yet assigned by admin"}</span>
        </Card>
      </div>

      {selectedTournament && (
        <RegisterTournamentModal tournament={selectedTournament} onClose={() => setSelectedTournament(null)} />
      )}
    </div>
  );
}
