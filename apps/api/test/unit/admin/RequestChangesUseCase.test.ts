import { describe, it, expect } from "vitest";
import { makeRequestChangesUseCase } from "../../../src/application/admin/RequestChangesUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { NotFoundError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput } from "@cricket-platform/shared";

const PROFILE: PlayerProfileInput = {
  fullName: "Vikram Singh",
  dateOfBirth: new Date("1995-01-20"),
  gender: "MALE",
  cricketRole: "BOWLER",
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
  const requestChanges = makeRequestChangesUseCase({ playerRepo, auditLogRepo });
  return { playerRepo, auditLogRepo, requestChanges };
}

describe("RequestChangesUseCase", () => {
  it("moves a pending player to CHANGES_REQUESTED with the given message", async () => {
    const { playerRepo, requestChanges } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    const updated = await requestChanges(player.id, "Please upload a clearer photo", "admin-1");

    expect(updated.verificationStatus).toBe("CHANGES_REQUESTED");
  });

  it("throws NotFoundError for an unknown player id", async () => {
    const { requestChanges } = setup();
    await expect(requestChanges("unknown-id", "message", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records an audit log entry with the actor, action, entity, and the message", async () => {
    const { playerRepo, auditLogRepo, requestChanges } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    await requestChanges(player.id, "Address proof is blurry", "admin-3");

    expect(auditLogRepo.entries).toHaveLength(1);
    // See the equivalent note in RejectPlayerUseCase.test.ts: `before` isn't
    // asserted because the in-memory fake mutates the player record in
    // place before this entry is built, unlike the real Prisma repository.
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-3",
      action: "PLAYER_CHANGES_REQUESTED",
      entityType: "Player",
      entityId: player.id,
      after: { verificationStatus: "CHANGES_REQUESTED", message: "Address proof is blurry" },
    });
    expect(auditLogRepo.entries[0].before).toBeDefined();
  });

  it("allows requesting changes again on a player already in CHANGES_REQUESTED (no state-machine restriction)", async () => {
    const { playerRepo, requestChanges } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await requestChanges(player.id, "first note", "admin-1");

    const updated = await requestChanges(player.id, "second note", "admin-1");

    expect(updated.verificationStatus).toBe("CHANGES_REQUESTED");
  });

  it("does not block requesting changes on an already-VERIFIED player (no verification-status guard exists in this use case)", async () => {
    const { playerRepo, requestChanges } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await playerRepo.assignPlayerId(player.id, "AVI-000001", "admin-1");

    const updated = await requestChanges(player.id, "please re-verify emergency contact", "admin-1");

    expect(updated.verificationStatus).toBe("CHANGES_REQUESTED");
  });
});
