import { describe, it, expect } from "vitest";
import { makeDeleteTournamentUseCase } from "../../../src/application/tournaments/DeleteTournamentUseCase";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { NotFoundError } from "../../../src/domain/errors/DomainError";
import type { TournamentInput } from "@cricket-platform/shared";

const TOURNAMENT_INPUT: TournamentInput = {
  name: "Summer T20 Cup",
  venue: "Bengaluru Ground",
  startDate: new Date("2026-09-05"),
  endDate: new Date("2026-09-20"),
  registrationOpenAt: new Date(Date.now() - 86_400_000),
  registrationCloseAt: new Date(Date.now() + 86_400_000),
  entryFee: 0,
  feeRequired: false,
};

function setup() {
  const tournamentRepo = new InMemoryTournamentRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const deleteTournament = makeDeleteTournamentUseCase({ tournamentRepo, auditLogRepo });
  return { tournamentRepo, auditLogRepo, deleteTournament };
}

describe("DeleteTournamentUseCase", () => {
  it("throws NotFoundError for an unknown tournament id", async () => {
    const { deleteTournament } = setup();
    await expect(deleteTournament("unknown-id", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("removes the tournament from the repository", async () => {
    const { tournamentRepo, deleteTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });

    await deleteTournament(tournament.id, "admin-1");

    expect(await tournamentRepo.findById(tournament.id)).toBeNull();
    expect(tournamentRepo.tournaments).toHaveLength(0);
  });

  it("does not disturb other tournaments", async () => {
    const { tournamentRepo, deleteTournament } = setup();
    const toDelete = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    const toKeep = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "winter-t20", createdByAdminId: "admin-1" });

    await deleteTournament(toDelete.id, "admin-1");

    expect(await tournamentRepo.findById(toKeep.id)).not.toBeNull();
  });

  it("records an audit log entry capturing the deleted tournament's name and status", async () => {
    const { tournamentRepo, auditLogRepo, deleteTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });

    await deleteTournament(tournament.id, "admin-5");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-5",
      action: "TOURNAMENT_DELETED",
      entityType: "Tournament",
      entityId: tournament.id,
      before: { name: TOURNAMENT_INPUT.name, status: "DRAFT" },
    });
  });
});
