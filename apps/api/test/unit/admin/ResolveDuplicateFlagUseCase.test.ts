import { describe, it, expect } from "vitest";
import { makeResolveDuplicateFlagUseCase } from "../../../src/application/admin/ResolveDuplicateFlagUseCase";
import { InMemoryDuplicateFlagRepository } from "../fakes/InMemoryDuplicateFlagRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";

function setup() {
  const duplicateFlagRepo = new InMemoryDuplicateFlagRepository();
  const auditLogRepo = new InMemoryAuditLogRepository();
  const resolveDuplicateFlag = makeResolveDuplicateFlagUseCase({ duplicateFlagRepo, auditLogRepo });
  return { duplicateFlagRepo, auditLogRepo, resolveDuplicateFlag };
}

describe("ResolveDuplicateFlagUseCase", () => {
  it("dismisses a flag as a false positive", async () => {
    const { duplicateFlagRepo, resolveDuplicateFlag } = setup();
    const flag = await duplicateFlagRepo.create({
      playerId: "player-1",
      suspectedDuplicatePlayerId: "player-2",
      signal: "NAME_DOB_MATCH",
    });

    const resolved = await resolveDuplicateFlag(flag.id, "DISMISSED", "admin-1");

    expect(resolved.status).toBe("DISMISSED");
  });

  it("marks a flag CONFIRMED_MERGED when the admin confirms it is the same person", async () => {
    const { duplicateFlagRepo, resolveDuplicateFlag } = setup();
    const flag = await duplicateFlagRepo.create({
      playerId: "player-1",
      suspectedDuplicatePlayerId: "player-2",
      signal: "EMERGENCY_CONTACT_REUSE",
    });

    const resolved = await resolveDuplicateFlag(flag.id, "CONFIRMED_MERGED", "admin-1");

    expect(resolved.status).toBe("CONFIRMED_MERGED");
  });

  it("removes the flag from the open list once resolved", async () => {
    const { duplicateFlagRepo, resolveDuplicateFlag } = setup();
    const flag = await duplicateFlagRepo.create({
      playerId: "player-1",
      suspectedDuplicatePlayerId: "player-2",
      signal: "NAME_DOB_MATCH",
    });

    await resolveDuplicateFlag(flag.id, "DISMISSED", "admin-1");

    expect(await duplicateFlagRepo.listOpen()).toHaveLength(0);
  });

  it("records an audit log entry with the admin id, action, and resolution", async () => {
    const { duplicateFlagRepo, auditLogRepo, resolveDuplicateFlag } = setup();
    const flag = await duplicateFlagRepo.create({
      playerId: "player-1",
      suspectedDuplicatePlayerId: "player-2",
      signal: "NAME_DOB_MATCH",
    });

    await resolveDuplicateFlag(flag.id, "DISMISSED", "admin-42");

    expect(auditLogRepo.entries).toHaveLength(1);
    expect(auditLogRepo.entries[0]).toMatchObject({
      actorAdminId: "admin-42",
      action: "DUPLICATE_FLAG_RESOLVED",
      entityType: "DuplicateFlag",
      entityId: flag.id,
      after: { resolution: "DISMISSED" },
    });
  });

  it("propagates the repository's not-found error for an unknown flag id", async () => {
    const { resolveDuplicateFlag } = setup();
    await expect(resolveDuplicateFlag("unknown-id", "DISMISSED", "admin-1")).rejects.toThrow();
  });
});
