import { describe, it, expect } from "vitest";
import { makePublishTournamentUseCase } from "../../../src/application/tournaments/PublishTournamentUseCase";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
import { ConflictError, NotFoundError } from "../../../src/domain/errors/DomainError";
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
  const publishTournament = makePublishTournamentUseCase({ tournamentRepo });
  return { tournamentRepo, publishTournament };
}

describe("PublishTournamentUseCase", () => {
  it("throws NotFoundError for an unknown tournament id", async () => {
    const { publishTournament } = setup();
    await expect(publishTournament("unknown-id")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("transitions a DRAFT tournament to PUBLISHED", async () => {
    const { tournamentRepo, publishTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    expect(tournament.status).toBe("DRAFT");

    const published = await publishTournament(tournament.id);

    expect(published.status).toBe("PUBLISHED");
  });

  it("refuses to publish a tournament that is already PUBLISHED", async () => {
    const { tournamentRepo, publishTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await publishTournament(tournament.id);

    await expect(publishTournament(tournament.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to publish a CANCELLED tournament", async () => {
    const { tournamentRepo, publishTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "CANCELLED");

    await expect(publishTournament(tournament.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to publish a COMPLETED tournament", async () => {
    const { tournamentRepo, publishTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "COMPLETED");

    await expect(publishTournament(tournament.id)).rejects.toBeInstanceOf(ConflictError);
  });
});
