import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { makeScanCheckinUseCase } from "../../../src/application/checkin/ScanCheckinUseCase";
import { InMemoryRegistrationRepository } from "../fakes/InMemoryRegistrationRepository";
import { InMemoryCheckinRepository } from "../fakes/InMemoryCheckinRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { ConflictError, NotFoundError } from "../../../src/domain/errors/DomainError";
import type { RegistrationWithRelations } from "../../../src/domain/repositories/RegistrationRepository";

function setup() {
  const registrationRepo = new InMemoryRegistrationRepository();
  const checkinRepo = new InMemoryCheckinRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const scanCheckin = makeScanCheckinUseCase({ registrationRepo, checkinRepo, auditLogRepo });
  return { registrationRepo, checkinRepo, auditLogRepo, scanCheckin };
}

function seedRegistration(
  registrationRepo: InMemoryRegistrationRepository,
  overrides: Partial<RegistrationWithRelations> = {},
): RegistrationWithRelations {
  const now = new Date().toISOString();
  const registration: RegistrationWithRelations = {
    id: crypto.randomUUID(),
    playerId: "player-1",
    tournamentId: "tournament-1",
    status: "CONFIRMED",
    rulesAccepted: true,
    rulesAcceptedAt: now,
    qrToken: "qr-token-1",
    createdAt: now,
    updatedAt: now,
    player: { id: "player-1", fullName: "Test Player", playerId: "AVI-000099", mobile: "+919876543210" },
    tournament: { id: "tournament-1", name: "Test Tournament", feeRequired: false, entryFee: 0 },
    ...overrides,
  };
  registrationRepo.registrations.push(registration);
  return registration;
}

describe("ScanCheckinUseCase", () => {
  it("records attendance for a valid, confirmed registration", async () => {
    const { registrationRepo, checkinRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo);

    const { checkin, player } = await scanCheckin(registration.qrToken, registration.tournamentId, "admin-1", "gate-scanner-1");

    expect(checkin.registrationId).toBe(registration.id);
    expect(checkinRepo.checkins).toHaveLength(1);
    expect(player.id).toBe("player-1");
    expect((await registrationRepo.findById(registration.id))?.status).toBe("CHECKED_IN");
  });

  it("writes an audit log entry for the check-in", async () => {
    const { registrationRepo, auditLogRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo);

    await scanCheckin(registration.qrToken, registration.tournamentId, "admin-1");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-1",
      action: "PLAYER_CHECKED_IN",
      entityType: "Registration",
      entityId: registration.id,
    });
  });

  it("rejects a second scan of an already-checked-in player", async () => {
    const { registrationRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo);
    await scanCheckin(registration.qrToken, registration.tournamentId, "admin-1");

    await expect(scanCheckin(registration.qrToken, registration.tournamentId, "admin-1")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a scan for a registration that is still PENDING_PAYMENT", async () => {
    const { registrationRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo, { status: "PENDING_PAYMENT" });

    await expect(scanCheckin(registration.qrToken, registration.tournamentId, "admin-1")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a scan for a cancelled registration", async () => {
    const { registrationRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo, { status: "CANCELLED" });

    await expect(scanCheckin(registration.qrToken, registration.tournamentId, "admin-1")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("throws NotFoundError for an unknown QR token", async () => {
    const { scanCheckin } = setup();
    await expect(scanCheckin("unknown-token", "tournament-1", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the QR token is valid but belongs to a different tournament (player not registered for this one)", async () => {
    const { registrationRepo, scanCheckin } = setup();
    const registration = seedRegistration(registrationRepo, { tournamentId: "tournament-1" });

    await expect(scanCheckin(registration.qrToken, "some-other-tournament", "admin-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
