import { describe, it, expect } from "vitest";
import { makeAdminRegisterPlayerForTournamentUseCase } from "../../../src/application/registrations/AdminRegisterPlayerForTournamentUseCase";
import { makeRegisterForTournamentUseCase } from "../../../src/application/registrations/RegisterForTournamentUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryTournamentRepository } from "../fakes/InMemoryTournamentRepository";
import { InMemoryRegistrationRepository } from "../fakes/InMemoryRegistrationRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { FakeWhatsAppProvider } from "../fakes/fakeProviders";
import { ForbiddenError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput, TournamentInput } from "@cricket-platform/shared";

const PLAYER_PROFILE: PlayerProfileInput = {
  fullName: "Kavya Nair",
  dateOfBirth: new Date("1997-06-01"),
  gender: "FEMALE",
  battingStyle: "RIGHT_HAND",
  bowlingStyle: "NONE",
  addressLine1: "3 Marine Drive",
  pincode: "682001",
  city: "Kochi",
  state: "Kerala",
  country: "India",
  jerseySize: "M",
};

const TOURNAMENT_INPUT: TournamentInput = {
  name: "Monsoon Cup",
  venue: "Kochi Ground",
  startDate: new Date("2026-10-05"),
  endDate: new Date("2026-10-20"),
  registrationOpenAt: new Date(Date.now() - 86_400_000),
  registrationCloseAt: new Date(Date.now() + 86_400_000),
  entryFee: 0,
  feeRequired: false,
};

function setup() {
  const playerRepo = new InMemoryPlayerRepository();
  const tournamentRepo = new InMemoryTournamentRepository();
  const registrationRepo = new InMemoryRegistrationRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const whatsAppProvider = new FakeWhatsAppProvider();
  const registerForTournament = makeRegisterForTournamentUseCase({
    playerRepo,
    tournamentRepo,
    registrationRepo,
    whatsAppProvider,
  });
  const adminRegisterPlayerForTournament = makeAdminRegisterPlayerForTournamentUseCase({
    registerForTournament,
    auditLogRepo,
  });
  return { playerRepo, tournamentRepo, registrationRepo, auditLogRepo, adminRegisterPlayerForTournament };
}

describe("AdminRegisterPlayerForTournamentUseCase", () => {
  it("registers an already-VERIFIED player into a published tournament", async () => {
    const { playerRepo, tournamentRepo, adminRegisterPlayerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543270", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "monsoon-cup", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration, alreadyExisted } = await adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9");

    expect(alreadyExisted).toBe(false);
    expect(registration.status).toBe("CONFIRMED");
  });

  it("rejects a player who has not been verified yet, same as self-service registration", async () => {
    const { playerRepo, tournamentRepo, adminRegisterPlayerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543270", ...PLAYER_PROFILE }); // still PENDING_VERIFICATION
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "monsoon-cup", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    await expect(adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("records an audit log entry attributing the registration to the acting admin", async () => {
    const { playerRepo, tournamentRepo, auditLogRepo, adminRegisterPlayerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543270", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "monsoon-cup", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration } = await adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-9",
      action: "PLAYER_REGISTERED_BY_ADMIN",
      entityType: "Registration",
      entityId: registration.id,
    });
  });

  it("passes willingToBowl and notes through to the registration and records them in the audit log", async () => {
    const { playerRepo, tournamentRepo, auditLogRepo, adminRegisterPlayerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543270", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "monsoon-cup", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    const { registration } = await adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9", {
      willingToBowl: false,
      notes: "Carrying a shoulder niggle, batting only",
    });

    expect(registration.willingToBowl).toBe(false);
    expect(registration.notes).toBe("Carrying a shoulder niggle, batting only");
    expect(auditLogRepo.entries[0].after).toMatchObject({
      willingToBowl: false,
      notes: "Carrying a shoulder niggle, batting only",
    });
  });

  it("does not duplicate the audit log entry when registering the same player twice (idempotent)", async () => {
    const { playerRepo, tournamentRepo, auditLogRepo, adminRegisterPlayerForTournament } = setup();
    const player = await playerRepo.create({ mobile: "+919876543270", ...PLAYER_PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");
    const tournament = await tournamentRepo.create({ ...TOURNAMENT_INPUT, slug: "monsoon-cup", createdByAdminId: "admin-1" });
    await tournamentRepo.setStatus(tournament.id, "PUBLISHED");

    await adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9");
    const second = await adminRegisterPlayerForTournament(tournament.id, player.id, "admin-9");

    expect(second.alreadyExisted).toBe(true);
    expect(auditLogRepo.entries).toHaveLength(1);
  });
});
