import { describe, it, expect } from "vitest";
import { makeRejectPlayerUseCase } from "../../../src/application/admin/RejectPlayerUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { ConflictError, NotFoundError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput } from "@cricket-platform/shared";

const PROFILE: PlayerProfileInput = {
  fullName: "Vikram Singh",
  dateOfBirth: new Date("1995-01-20"),
  gender: "MALE",
  playerType: "BOWLER",
  battingStyle: "RIGHT_HAND",
  bowlingStyle: "RIGHT_ARM_FAST",
  preferredBattingPosition: 9,
  experienceLevel: "PROFESSIONAL",
  addressLine1: "12 Sector 17 Market",
  pincode: "160017",
  city: "Chandigarh",
  state: "Punjab",
  country: "India",
  emergencyContactName: "Harpreet Singh",
  emergencyContactRelation: "Brother",
  emergencyContactPhone: "+919876543231",
  jerseySize: "XL",
};

function setup() {
  const playerRepo = new InMemoryPlayerRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const rejectPlayer = makeRejectPlayerUseCase({ playerRepo, auditLogRepo });
  return { playerRepo, auditLogRepo, rejectPlayer };
}

describe("RejectPlayerUseCase", () => {
  it("marks a pending player REJECTED with the given reason", async () => {
    const { playerRepo, rejectPlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    const rejected = await rejectPlayer(player.id, "Photo does not match ID", "admin-1");

    expect(rejected.verificationStatus).toBe("REJECTED");
    expect(rejected.rejectionReason).toBe("Photo does not match ID");
  });

  it("throws NotFoundError for an unknown player id", async () => {
    const { rejectPlayer } = setup();
    await expect(rejectPlayer("unknown-id", "reason", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses to reject an already-VERIFIED player — suspend instead", async () => {
    const { playerRepo, rejectPlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");

    await expect(rejectPlayer(player.id, "reason", "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("records an audit log entry with the actor, action, entity, and after-state", async () => {
    const { playerRepo, auditLogRepo, rejectPlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    await rejectPlayer(player.id, "Incomplete address", "admin-7");

    expect(auditLogRepo.entries).toHaveLength(1);
    // Note: `before` is read off the same in-memory player record that
    // setVerificationStatus() already mutated by this point (the fake
    // mutates in place rather than returning a fresh row like Prisma
    // would), so it is not asserted here — only the fields unaffected by
    // that aliasing quirk are.
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-7",
      action: "PLAYER_REJECTED",
      entityType: "Player",
      entityId: player.id,
      after: { verificationStatus: "REJECTED", reason: "Incomplete address" },
    });
    expect(auditLogRepo.entries[0].before).toBeDefined();
  });

  it("allows rejecting a player who previously had CHANGES_REQUESTED", async () => {
    const { playerRepo, rejectPlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await playerRepo.setVerificationStatus(player.id, "CHANGES_REQUESTED", { changeRequestNote: "fix address" });

    const rejected = await rejectPlayer(player.id, "Still incomplete", "admin-1");

    expect(rejected.verificationStatus).toBe("REJECTED");
  });
});
