import { describe, it, expect } from "vitest";
import { makeDetectDuplicatesUseCase } from "../../../src/application/admin/DetectDuplicatesUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryDuplicateFlagRepository } from "../fakes/InMemoryDuplicateFlagRepository";
import type { PlayerProfileInput } from "@cricket-platform/shared";

const PROFILE: PlayerProfileInput = {
  fullName: "Rohan Sharma",
  dateOfBirth: new Date("1998-04-12"),
  gender: "MALE",
  cricketRole: "BATSMAN",
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

function setup() {
  const playerRepo = new InMemoryPlayerRepository();
  const duplicateFlagRepo = new InMemoryDuplicateFlagRepository();
  const detectDuplicates = makeDetectDuplicatesUseCase({ playerRepo, duplicateFlagRepo });
  return { playerRepo, duplicateFlagRepo, detectDuplicates };
}

describe("DetectDuplicatesUseCase", () => {
  it("returns no flags for a brand-new player with no matches", async () => {
    const { playerRepo, detectDuplicates } = setup();
    const player = await playerRepo.create({ mobile: "+919876543210", ...PROFILE });

    const flags = await detectDuplicates(player.id);

    expect(flags).toHaveLength(0);
  });

  it("returns an empty list for an unknown player id instead of throwing", async () => {
    const { detectDuplicates } = setup();
    await expect(detectDuplicates("unknown-id")).resolves.toEqual([]);
  });

  it("flags NAME_DOB_MATCH when another player shares the same full name and date of birth but a different emergency contact", async () => {
    const { playerRepo, detectDuplicates } = setup();
    await playerRepo.create({ mobile: "+919876543210", ...PROFILE });
    const second = await playerRepo.create({
      mobile: "+919876543299",
      ...PROFILE,
      emergencyContactPhone: "+919876500000",
    });

    const flags = await detectDuplicates(second.id);

    expect(flags).toHaveLength(1);
    expect(flags[0].signal).toBe("NAME_DOB_MATCH");
    expect(flags[0].playerId).toBe(second.id);
  });

  it("prefers EMERGENCY_CONTACT_REUSE over NAME_DOB_MATCH when both signals are present", async () => {
    const { playerRepo, detectDuplicates } = setup();
    await playerRepo.create({ mobile: "+919876543210", ...PROFILE });
    const second = await playerRepo.create({ mobile: "+919876543299", ...PROFILE });

    const flags = await detectDuplicates(second.id);

    expect(flags).toHaveLength(1);
    expect(flags[0].signal).toBe("EMERGENCY_CONTACT_REUSE");
  });

  it("flags EMERGENCY_CONTACT_REUSE when two otherwise-distinct players share an emergency contact number", async () => {
    const { playerRepo, detectDuplicates } = setup();
    await playerRepo.create({ mobile: "+919876543210", ...PROFILE, fullName: "First Player" });
    const second = await playerRepo.create({
      mobile: "+919876543299",
      ...PROFILE,
      fullName: "Totally Different Name",
      dateOfBirth: new Date("1990-01-01"),
    });

    const flags = await detectDuplicates(second.id);

    expect(flags).toHaveLength(1);
    expect(flags[0].signal).toBe("EMERGENCY_CONTACT_REUSE");
  });

  it("does not create a duplicate flag if an open one already exists for the same pair", async () => {
    const { playerRepo, duplicateFlagRepo, detectDuplicates } = setup();
    await playerRepo.create({ mobile: "+919876543210", ...PROFILE });
    const second = await playerRepo.create({ mobile: "+919876543299", ...PROFILE });

    await detectDuplicates(second.id);
    const flagsAfterSecondRun = await detectDuplicates(second.id);

    expect(flagsAfterSecondRun).toHaveLength(0);
    expect(duplicateFlagRepo.flags).toHaveLength(1);
  });

  it("flags the newer player against the earlier one even though the earlier player's own scan found nothing yet", async () => {
    const { playerRepo, duplicateFlagRepo, detectDuplicates } = setup();
    const first = await playerRepo.create({ mobile: "+919876543210", ...PROFILE });
    await detectDuplicates(first.id);
    const second = await playerRepo.create({ mobile: "+919876543299", ...PROFILE });

    const flags = await detectDuplicates(second.id);

    expect(flags).toHaveLength(1);
    expect(flags[0].suspectedDuplicatePlayerId).toBe(first.id);
    expect(duplicateFlagRepo.flags).toHaveLength(1);
  });
});
