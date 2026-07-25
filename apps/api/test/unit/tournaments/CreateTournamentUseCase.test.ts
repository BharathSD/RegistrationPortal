import { describe, it, expect } from "vitest";
import { makeCreateTournamentUseCase } from "../../../src/application/tournaments/CreateTournamentUseCase";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
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
  const createTournament = makeCreateTournamentUseCase({ tournamentRepo });
  return { tournamentRepo, createTournament };
}

describe("CreateTournamentUseCase", () => {
  it("creates a DRAFT tournament with a slug derived from the name", async () => {
    const { createTournament } = setup();

    const tournament = await createTournament(TOURNAMENT_INPUT, "admin-1");

    expect(tournament.status).toBe("DRAFT");
    expect(tournament.name).toBe("Summer T20 Cup");
    expect(tournament.slug).toMatch(/^summer-t20-cup-/);
    expect(tournament.createdByAdminId).toBe("admin-1");
  });

  it("persists the entry fee and fee-required flag for a paid tournament", async () => {
    const { createTournament, tournamentRepo } = setup();

    const tournament = await createTournament({ ...TOURNAMENT_INPUT, feeRequired: true, entryFee: 750 }, "admin-1");

    expect(tournament.feeRequired).toBe(true);
    expect(tournament.entryFee).toBe(750);
    expect(tournamentRepo.tournaments).toHaveLength(1);
  });

  it("produces distinct slugs for two tournaments created with the same name", async () => {
    const { createTournament } = setup();

    const first = await createTournament(TOURNAMENT_INPUT, "admin-1");
    const second = await createTournament(TOURNAMENT_INPUT, "admin-1");

    expect(first.id).not.toBe(second.id);
  });
});
