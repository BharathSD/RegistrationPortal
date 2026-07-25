import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { makeGetAttendanceRosterUseCase } from "../../../src/application/checkin/GetAttendanceRosterUseCase";
import { InMemoryRegistrationRepository } from "../fakes/InMemoryRegistrationRepository";
import { InMemoryCheckinRepository } from "../fakes/InMemoryCheckinRepository";
import type { RegistrationWithRelations } from "../../../src/domain/repositories/RegistrationRepository";
import type { RegistrationStatus } from "@cricket-platform/shared";

function setup() {
  const registrationRepo = new InMemoryRegistrationRepository();
  const checkinRepo = new InMemoryCheckinRepository();
  const getAttendanceRoster = makeGetAttendanceRosterUseCase({ registrationRepo, checkinRepo });
  return { registrationRepo, checkinRepo, getAttendanceRoster };
}

function seedRegistration(
  registrationRepo: InMemoryRegistrationRepository,
  tournamentId: string,
  status: RegistrationStatus,
  playerId: string,
): RegistrationWithRelations {
  const now = new Date().toISOString();
  const registration: RegistrationWithRelations = {
    id: crypto.randomUUID(),
    playerId,
    tournamentId,
    status,
    rulesAccepted: true,
    rulesAcceptedAt: now,
    qrToken: crypto.randomBytes(8).toString("base64url"),
    createdAt: now,
    updatedAt: now,
    player: { id: playerId, fullName: `Player ${playerId}`, playerId: "AVI-000099", mobile: "+919876543210" },
    tournament: { id: tournamentId, name: "Test Tournament", feeRequired: false, entryFee: 0 },
  };
  registrationRepo.registrations.push(registration);
  return registration;
}

describe("GetAttendanceRosterUseCase", () => {
  it("returns an empty roster for a tournament with no registrations", async () => {
    const { getAttendanceRoster } = setup();
    const result = await getAttendanceRoster("tournament-1");

    expect(result.roster).toHaveLength(0);
    expect(result.totalConfirmed).toBe(0);
    expect(result.checkedInCount).toBe(0);
  });

  it("counts CONFIRMED and CHECKED_IN registrations toward totalConfirmed, but not PENDING_PAYMENT or CANCELLED", async () => {
    const { registrationRepo, getAttendanceRoster } = setup();
    seedRegistration(registrationRepo, "tournament-1", "CONFIRMED", "p1");
    seedRegistration(registrationRepo, "tournament-1", "CHECKED_IN", "p2");
    seedRegistration(registrationRepo, "tournament-1", "PENDING_PAYMENT", "p3");
    seedRegistration(registrationRepo, "tournament-1", "CANCELLED", "p4");

    const result = await getAttendanceRoster("tournament-1");

    expect(result.roster).toHaveLength(4);
    expect(result.totalConfirmed).toBe(2);
  });

  it("reports checkedInCount from the checkin repository, independent of registration status counts", async () => {
    const { registrationRepo, checkinRepo, getAttendanceRoster } = setup();
    const reg = seedRegistration(registrationRepo, "tournament-1", "CHECKED_IN", "p1");
    await checkinRepo.create({ registrationId: reg.id, tournamentId: "tournament-1", scannedByAdminId: "admin-1" });

    const result = await getAttendanceRoster("tournament-1");

    expect(result.checkedInCount).toBe(1);
  });

  it("only includes registrations for the requested tournament", async () => {
    const { registrationRepo, getAttendanceRoster } = setup();
    seedRegistration(registrationRepo, "tournament-1", "CONFIRMED", "p1");
    seedRegistration(registrationRepo, "tournament-2", "CONFIRMED", "p2");

    const result = await getAttendanceRoster("tournament-1");

    expect(result.roster).toHaveLength(1);
    expect(result.roster[0].tournamentId).toBe("tournament-1");
  });
});
