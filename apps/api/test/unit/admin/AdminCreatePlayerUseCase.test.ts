import { describe, it, expect } from "vitest";
import { makeAdminCreatePlayerUseCase } from "../../../src/application/admin/AdminCreatePlayerUseCase";
import { makeRegisterPlayerUseCase } from "../../../src/application/players/RegisterPlayerUseCase";
import { makeDetectDuplicatesUseCase } from "../../../src/application/admin/DetectDuplicatesUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryDuplicateFlagRepository } from "../fakes/InMemoryDuplicateFlagRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { ConflictError } from "../../../src/domain/errors/DomainError";
import type { AdminCreatePlayerInput } from "@cricket-platform/shared";

const INPUT: AdminCreatePlayerInput = {
  mobile: "+919876543260",
  fullName: "Deepak Kumar",
  dateOfBirth: new Date("1990-03-15"),
  gender: "MALE",
  battingStyle: "RIGHT_HAND",
  bowlingStyle: "NONE",
  addressLine1: "7 MG Road",
  pincode: "110001",
  city: "New Delhi",
  state: "Delhi",
  country: "India",
  jerseySize: "L",
};

function setup() {
  const playerRepo = new InMemoryPlayerRepository();
  const duplicateFlagRepo = new InMemoryDuplicateFlagRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const registerPlayer = makeRegisterPlayerUseCase({ playerRepo });
  const detectDuplicates = makeDetectDuplicatesUseCase({ playerRepo, duplicateFlagRepo });
  const adminCreatePlayer = makeAdminCreatePlayerUseCase({ registerPlayer, detectDuplicates, auditLogRepo });
  return { playerRepo, duplicateFlagRepo, auditLogRepo, adminCreatePlayer };
}

describe("AdminCreatePlayerUseCase", () => {
  it("creates a PENDING_VERIFICATION player with no player type assigned", async () => {
    const { adminCreatePlayer } = setup();

    const player = await adminCreatePlayer(INPUT, "admin-1");

    expect(player.mobile).toBe("+919876543260");
    expect(player.verificationStatus).toBe("PENDING_VERIFICATION");
    expect(player.playerType).toBeNull();
  });

  it("refuses to create a second profile for a mobile that already has one", async () => {
    const { adminCreatePlayer } = setup();
    await adminCreatePlayer(INPUT, "admin-1");

    await expect(adminCreatePlayer(INPUT, "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("runs duplicate detection against existing players, same as self-registration", async () => {
    const { adminCreatePlayer, duplicateFlagRepo } = setup();
    await adminCreatePlayer(INPUT, "admin-1");

    await adminCreatePlayer(
      { ...INPUT, mobile: "+919876543261", emergencyContactPhone: undefined },
      "admin-1",
    );

    expect(duplicateFlagRepo.flags.length).toBeGreaterThan(0);
  });

  it("records an audit log entry attributing the creation to the acting admin", async () => {
    const { adminCreatePlayer, auditLogRepo } = setup();

    const player = await adminCreatePlayer(INPUT, "admin-7");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-7",
      action: "PLAYER_CREATED_BY_ADMIN",
      entityType: "Player",
      entityId: player.id,
    });
  });
});
