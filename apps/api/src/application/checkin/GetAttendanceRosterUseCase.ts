import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import type { CheckinRepository } from "../../domain/repositories/CheckinRepository";

export function makeGetAttendanceRosterUseCase({
  registrationRepo,
  checkinRepo,
}: {
  registrationRepo: RegistrationRepository;
  checkinRepo: CheckinRepository;
}) {
  return async function getAttendanceRoster(tournamentId: string) {
    const [roster, checkedInCount] = await Promise.all([
      registrationRepo.listByTournament(tournamentId),
      checkinRepo.countByTournament(tournamentId),
    ]);
    return {
      roster,
      totalConfirmed: roster.filter((r) => r.status === "CONFIRMED" || r.status === "CHECKED_IN").length,
      checkedInCount,
    };
  };
}
