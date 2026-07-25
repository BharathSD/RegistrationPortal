import { describe, it, expect } from "vitest";
import { makeListDuplicateFlagsUseCase } from "../../../src/application/admin/ListDuplicateFlagsUseCase";
import { InMemoryDuplicateFlagRepository } from "../fakes/InMemoryDuplicateFlagRepository";

function setup() {
  const duplicateFlagRepo = new InMemoryDuplicateFlagRepository();
  const listDuplicateFlags = makeListDuplicateFlagsUseCase({ duplicateFlagRepo });
  return { duplicateFlagRepo, listDuplicateFlags };
}

describe("ListDuplicateFlagsUseCase", () => {
  it("returns an empty list when there are no flags", async () => {
    const { listDuplicateFlags } = setup();
    expect(await listDuplicateFlags()).toEqual([]);
  });

  it("lists only OPEN flags, excluding resolved ones", async () => {
    const { duplicateFlagRepo, listDuplicateFlags } = setup();
    const open = await duplicateFlagRepo.create({
      playerId: "player-1",
      suspectedDuplicatePlayerId: "player-2",
      signal: "NAME_DOB_MATCH",
    });
    const resolved = await duplicateFlagRepo.create({
      playerId: "player-3",
      suspectedDuplicatePlayerId: "player-4",
      signal: "EMERGENCY_CONTACT_REUSE",
    });
    await duplicateFlagRepo.resolve(resolved.id, "DISMISSED");

    const flags = await listDuplicateFlags();

    expect(flags).toHaveLength(1);
    expect(flags[0].id).toBe(open.id);
  });

  it("includes every open flag when there are several", async () => {
    const { duplicateFlagRepo, listDuplicateFlags } = setup();
    await duplicateFlagRepo.create({ playerId: "p1", suspectedDuplicatePlayerId: "p2", signal: "NAME_DOB_MATCH" });
    await duplicateFlagRepo.create({ playerId: "p3", suspectedDuplicatePlayerId: "p4", signal: "PHOTO_HASH_MATCH" });

    const flags = await listDuplicateFlags();

    expect(flags).toHaveLength(2);
  });
});
