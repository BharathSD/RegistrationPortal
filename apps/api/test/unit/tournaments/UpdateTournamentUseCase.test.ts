import { describe, it, expect } from "vitest";
import { makeUpdateTournamentUseCase } from "../../../src/application/tournaments/UpdateTournamentUseCase";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
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
  const updateTournament = makeUpdateTournamentUseCase({ tournamentRepo });
  return { tournamentRepo, updateTournament };
}

describe("UpdateTournamentUseCase", () => {
  it("throws NotFoundError for an unknown tournament id", async () => {
    const { updateTournament } = setup();
    await expect(updateTournament("unknown-id", { venue: "New Venue" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("only changes the fields included in the patch, leaving the rest untouched", async () => {
    const { tournamentRepo, updateTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });

    const updated = await updateTournament(tournament.id, { venue: "New Stadium" });

    expect(updated.venue).toBe("New Stadium");
    expect(updated.name).toBe(TOURNAMENT_INPUT.name);
    expect(updated.entryFee).toBe(TOURNAMENT_INPUT.entryFee);
  });

  it("allows switching a tournament from free to fee-required", async () => {
    const { tournamentRepo, updateTournament } = setup();
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });

    const updated = await updateTournament(tournament.id, { feeRequired: true, entryFee: 300 });

    expect(updated.feeRequired).toBe(true);
    expect(updated.entryFee).toBe(300);
  });
});
