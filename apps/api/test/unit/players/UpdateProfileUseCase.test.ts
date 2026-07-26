import { describe, it, expect } from "vitest";
import { makeUpdateProfileUseCase } from "../../../src/application/players/UpdateProfileUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { NotFoundError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput } from "@cricket-platform/shared";

const PROFILE: PlayerProfileInput = {
  fullName: "Ananya Rao",
  dateOfBirth: new Date("2001-09-03"),
  gender: "FEMALE",
  playerType: "ALL_ROUNDER",
  battingStyle: "LEFT_HAND",
  bowlingStyle: "LEFT_ARM_SPIN",
  preferredBattingPosition: 5,
  experienceLevel: "INTERMEDIATE",
  addressLine1: "45 Vidyaranyapuram Main Road",
  pincode: "570001",
  city: "Mysuru",
  state: "Karnataka",
  country: "India",
  emergencyContactName: "Suresh Rao",
  emergencyContactRelation: "Father",
  emergencyContactPhone: "+919876543221",
  jerseySize: "M",
};

describe("UpdateProfileUseCase", () => {
  it("throws NotFoundError for an unknown player id", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const updateProfile = makeUpdateProfileUseCase({ playerRepo });
    await expect(updateProfile("unknown-id", { city: "Pune" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows edits that don't touch identity fields", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const updateProfile = makeUpdateProfileUseCase({ playerRepo });
    const player = await playerRepo.create({ mobile: "+919876543220", ...PROFILE });

    const updated = await updateProfile(player.id, { city: "Bengaluru" });
    expect(updated.city).toBe("Bengaluru");
  });

  it("allows a rename that happens to match another existing player's name + date of birth — mobile is the only identity key", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const updateProfile = makeUpdateProfileUseCase({ playerRepo });
    await playerRepo.create({ mobile: "+919876543220", ...PROFILE });
    const second = await playerRepo.create({
      mobile: "+919876543299",
      ...PROFILE,
      fullName: "Someone Else",
    });

    const updated = await updateProfile(second.id, { fullName: "Ananya Rao" });
    expect(updated.fullName).toBe("Ananya Rao");
  });

  it("allows a player to edit their own name without tripping over themselves", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const updateProfile = makeUpdateProfileUseCase({ playerRepo });
    const player = await playerRepo.create({ mobile: "+919876543220", ...PROFILE });

    const updated = await updateProfile(player.id, { fullName: "Ananya S Rao" });
    expect(updated.fullName).toBe("Ananya S Rao");
  });
});
