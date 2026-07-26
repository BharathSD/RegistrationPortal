import { describe, it, expect, beforeEach } from "vitest";
import { makeRegisterForTournamentUseCase } from "../../../src/application/registrations/RegisterForTournamentUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
import { InMemoryRegistrationRepository } from "../fakes/InMemoryRegistrationRepository";
import { FakeWhatsAppProvider } from "../fakes/fakeProviders";
import { ConflictError, ForbiddenError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput, TournamentInput } from "@cricket-platform/shared";

const PLAYER_PROFILE: PlayerProfileInput = {
  fullName: "Rohan Sharma",
  dateOfBirth: new Date("1998-04-12"),
  gender: "MALE",
  playerType: "BATSMAN",
  battingStyle: "RIGHT_HAND",
  bowlingStyle: "NONE",
  preferredBattingPosition: 3,
  experienceLevel: "ADVANCED",
  addressLine1: "221 Indiranagar 100 Feet Road",
  pincode: "560001",
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  emergencyContactName: "Meena Sharma",
  emergencyContactRelation: "Mother",
  emergencyContactPhone: "+919876543211",
  jerseySize: "L",
};

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
  const playerRepo = new InMemoryPlayerRepository();
  const tournamentRepo = new InMemoryTournamentRepository();
  const registrationRepo = new InMemoryRegistrationRepository();
  const whatsAppProvider = new FakeWhatsAppProvider();
  const registerForTournament = makeRegisterForTournamentUseCase({
    playerRepo,
    tournamentRepo,
    registrationRepo,
    whatsAppProvider,
  });
  return { playerRepo, tournamentRepo, registrationRepo, whatsAppProvider, registerForTournament };
}

describe("RegisterForTournamentUseCase", () => {
  it("confirms registration immediately for a free, published tournament", async () => {
    const { playerRepo, tournamentRepo, registerForTournament, whatsAppProvider } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration, alreadyExisted } = await registerForTournament(player.id, tournament.id, true);

    expect(alreadyExisted).toBe(false);
    expect(registration.status).toBe("CONFIRMED");
    expect(whatsAppProvider.sent).toHaveLength(1);
  });

  it("requires PENDING_PAYMENT status when the tournament charges an entry fee", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({
      ...TOURNAMENT_INPUT,
      feeRequired: true,
      entryFee: 500,
      slug: "paid-cup",
      createdByAdminId: "admin-1",
    });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration } = await registerForTournament(player.id, tournament.id, true);

    expect(registration.status).toBe("PENDING_PAYMENT");
  });

  it("rejects registration from a player who is not yet VERIFIED", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE }); // still PENDING_VERIFICATION
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    await expect(registerForTournament(player.id, tournament.id, true)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("is idempotent: registering twice returns the existing registration instead of erroring", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const first = await registerForTournament(player.id, tournament.id, true);
    const second = await registerForTournament(player.id, tournament.id, true);

    expect(second.alreadyExisted).toBe(true);
    expect(second.registration.id).toBe(first.registration.id);
  });

  it("lets a player re-register after cancelling, reusing the same row rather than erroring on the unique constraint", async () => {
    const { playerRepo, tournamentRepo, registrationRepo, registerForTournament, whatsAppProvider } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const first = await registerForTournament(player.id, tournament.id, true);
    await registrationRepo.setStatus(first.registration.id, "CANCELLED");

    const second = await registerForTournament(player.id, tournament.id, true);

    expect(second.alreadyExisted).toBe(false);
    expect(second.registration.id).toBe(first.registration.id);
    expect(second.registration.status).toBe("CONFIRMED");
    expect(registrationRepo.registrations).toHaveLength(1);
    expect(whatsAppProvider.sent).toHaveLength(2); // once on first registration, again on re-registration
  });

  it("clears a stale note from the cancelled registration when re-registering without a new one", async () => {
    const { playerRepo, tournamentRepo, registrationRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const first = await registerForTournament(player.id, tournament.id, true, { notes: "Unavailable on day 2" });
    await registrationRepo.setStatus(first.registration.id, "CANCELLED");

    const second = await registerForTournament(player.id, tournament.id, true);

    expect(second.registration.notes).toBeNull();
  });

  it("defaults willingToBowl to true and notes to null when no details are given", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration } = await registerForTournament(player.id, tournament.id, true);

    expect(registration.willingToBowl).toBe(true);
    expect(registration.notes).toBeNull();
  });

  it("persists an explicit willingToBowl:false opt-out and a notes comment", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "summer-t20", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration } = await registerForTournament(player.id, tournament.id, true, {
      willingToBowl: false,
      notes: "Unavailable on the 12th and 13th",
    });

    expect(registration.willingToBowl).toBe(false);
    expect(registration.notes).toBe("Unavailable on the 12th and 13th");
  });

  it("rejects registration once the tournament has reached max participants", async () => {
    const { playerRepo, tournamentRepo, registerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({
      ...TOURNAMENT_INPUT,
      maxParticipants: 1,
      slug: "small-cup",
      createdByAdminId: "admin-1",
    });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");
    tournamentRepo.confirmedCounts.set(tournament.id, 1);

    await expect(registerForTournament(player.id, tournament.id, true)).rejects.toBeInstanceOf(ConflictError);
  });
});
