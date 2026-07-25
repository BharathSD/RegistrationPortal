import { describe, it, expect } from "vitest";
import { makeRegisterPlayerUseCase } from "../../../src/application/players/RegisterPlayerUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { ConflictError } from "../../../src/domain/errors/DomainError";
import type { PlayerProfileInput } from "@cricket-platform/shared";

const PROFILE: PlayerProfileInput = {
  fullName: "Ananya Rao",
  dateOfBirth: new Date("2001-09-03"),
  gender: "FEMALE",
  cricketRole: "ALL_ROUNDER",
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

describe("RegisterPlayerUseCase", () => {
  it("creates a new PENDING_VERIFICATION player for a mobile with no existing profile", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const registerPlayer = makeRegisterPlayerUseCase({ playerRepo });

    const player = await registerPlayer("+919876543220", PROFILE);

    expect(player.verificationStatus).toBe("PENDING_VERIFICATION");
    expect(player.playerId).toBeNull();
    expect(player.mobile).toBe("+919876543220");
  });

  it("refuses to create a second profile for an already-registered mobile", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const registerPlayer = makeRegisterPlayerUseCase({ playerRepo });
    await registerPlayer("+919876543220", PROFILE);

    await expect(registerPlayer("+919876543220", PROFILE)).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows two different players to share the same name and date of birth, as long as the mobile numbers differ", async () => {
    const playerRepo = new InMemoryPlayerRepository();
    const registerPlayer = makeRegisterPlayerUseCase({ playerRepo });
    await registerPlayer("+919876543220", PROFILE);

    const second = registerPlayer("+919876543299", { ...PROFILE, fullName: "ANANYA RAO" });
    await expect(second).resolves.toMatchObject({ fullName: "ANANYA RAO", mobile: "+919876543299" });
  });
});
