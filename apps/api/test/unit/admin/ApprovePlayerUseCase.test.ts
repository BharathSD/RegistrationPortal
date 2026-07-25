import { describe, it, expect } from "vitest";
import { makeApprovePlayerUseCase } from "../../../src/application/admin/ApprovePlayerUseCase";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryAuditLogRepository } from "../fakes/InMemoryAuditLogRepository";
import { FakeWhatsAppProvider } from "../fakes/fakeProviders";
import { ConflictError, NotFoundError } from "../../../src/domain/errors/DomainError";
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
  const whatsAppProvider = new FakeWhatsAppProvider();
  const approvePlayer = makeApprovePlayerUseCase({ playerRepo, auditLogRepo, whatsAppProvider });
  return { playerRepo, auditLogRepo, whatsAppProvider, approvePlayer };
}

describe("ApprovePlayerUseCase", () => {
  it("issues a Player ID in the AVI-<SEQ> format, marks VERIFIED, and notifies via WhatsApp", async () => {
    const { playerRepo, whatsAppProvider, approvePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });

    const approved = await approvePlayer(player.id, "admin-1");

    expect(approved.verificationStatus).toBe("VERIFIED");
    expect(approved.playerId).toMatch(/^AVI-\d{6}$/);
    expect(whatsAppProvider.sent).toHaveLength(1);
    expect(whatsAppProvider.sent[0].to).toBe("+919876543230");
  });

  it("assigns sequential Player IDs globally, in approval order", async () => {
    const { playerRepo, approvePlayer } = setup();
    const p1 = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    const p2 = await playerRepo.create({ mobile: "+919876543240", ...PROFILE, fullName: "Second Player" });

    const approved1 = await approvePlayer(p1.id, "admin-1");
    const approved2 = await approvePlayer(p2.id, "admin-1");

    const seq1 = Number(approved1.playerId!.split("-")[1]);
    const seq2 = Number(approved2.playerId!.split("-")[1]);
    expect(seq2).toBe(seq1 + 1);
  });

  it("refuses to approve a player that is already VERIFIED", async () => {
    const { playerRepo, approvePlayer } = setup();
    const player = await playerRepo.create({ mobile: "+919876543230", ...PROFILE });
    await approvePlayer(player.id, "admin-1");

    await expect(approvePlayer(player.id, "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws NotFoundError for an unknown player id", async () => {
    const { approvePlayer } = setup();
    await expect(approvePlayer("unknown-id", "admin-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses to approve a player with no cricket category assigned yet", async () => {
    const { playerRepo, approvePlayer } = setup();
    const { cricketRole, ...profileWithoutRole } = PROFILE;
    const player = await playerRepo.create({ mobile: "+919876543230", ...profileWithoutRole });

    await expect(approvePlayer(player.id, "admin-1")).rejects.toBeInstanceOf(ConflictError);
  });
});
