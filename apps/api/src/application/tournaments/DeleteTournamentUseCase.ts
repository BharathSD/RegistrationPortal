import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeDeleteTournamentUseCase({
  tournamentRepo,
  auditLogRepo,
}: {
  tournamentRepo: TournamentRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function deleteTournament(tournamentId: string, adminId: string) {
    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);
    // Cascades to registrations/payments/checkins/stats/campaigns (see
    // TournamentRepository.remove) — the single most consequential admin
    // action in the system, so it's the one that most needs an audit trail.
    await tournamentRepo.remove(tournamentId);
    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "TOURNAMENT_DELETED",
      entityType: "Tournament",
      entityId: tournamentId,
      before: { name: tournament.name, status: tournament.status },
    });
  };
}
