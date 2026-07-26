import { describe, it, expect } from "vitest";
import { makeDeletePlayerUseCase } from "../../../src/application/admin/DeletePlayerUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryRefreshTokenRepository } from "../fakes/InMemoryRefreshTokenRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { NotFoundError } from "../../../src/domain/errors/DomainError";
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
  const refreshTokenRepo = new InMemoryRefreshTokenRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const deletePlayer = makeDeletePlayerUseCase({ playerRepo, refreshTokenRepo, auditLogRepo });
  return { playerRepo, refreshTokenRepo, auditLogRepo, deletePlayer };
}

describe("DeletePlayerUseCase", () => {
  it("throws NotFoundError for an unknown player id", async () => {
    const { deletePlayer } = setup();
    await expect(deletePlayer("unknown-id", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("soft-deletes the player so they no longer resolve by id", async () => {
    const { playerRepo, deletePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    await deletePlayer(player.id, "admin-1");

    expect(await playerRepo.findById(player.id)).toBeNull();
  });

  it("does not affect other players", async () => {
    const { playerRepo, deletePlayer } = setup();
    const toDelete = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    const toKeep = await playerRepo.create({ mobile: "+919876543240", ...PROFILE, fullName: "Second Player" });

    await deletePlayer(toDelete.id, "admin-1");

    expect(await playerRepo.findById(toKeep.id)).not.toBeNull();
  });

  it("throws NotFoundError when deleting the same player twice", async () => {
    const { playerRepo, deletePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await deletePlayer(player.id, "admin-1");

    await expect(deletePlayer(player.id, "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("revokes every active refresh token belonging to the deleted player, so a live session can't mint a fresh access token", async () => {
    const { playerRepo, refreshTokenRepo, deletePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    const token = await refreshTokenRepo.create({
      playerId: player.id,
      tokenHash: "hash-1",
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    const otherPlayerToken = await refreshTokenRepo.create({
      playerId: "some-other-player",
      tokenHash: "hash-2",
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await deletePlayer(player.id, "admin-1");

    expect((await refreshTokenRepo.findByHash("hash-1"))?.revokedAt).not.toBeNull();
    expect((await refreshTokenRepo.findByHash("hash-2"))?.revokedAt).toBeNull();
    // sanity: the two setup tokens are distinct records
    expect(token.id).not.toBe(otherPlayerToken.id);
  });

  it("records an audit log entry for the deletion", async () => {
    const { playerRepo, auditLogRepo, deletePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    await deletePlayer(player.id, "admin-9");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-9",
      action: "PLAYER_DELETED",
      entityType: "Player",
      entityId: player.id,
    });
  });
});
