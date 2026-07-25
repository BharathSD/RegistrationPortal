import { describe, it, expect } from "vitest";
import { makeRequestOtpUseCase } from "../../../src/application/auth/RequestOtpUseCase";
import { makeVerifyOtpUseCase } from "../../../src/application/auth/VerifyOtpUseCase";
import { InMemoryOtpRepository } from "../fakes/InMemoryOtpRepository";
import { InMemoryPlayerRepository } from "../fakes/InMemoryPlayerRepository";
import { InMemoryRefreshTokenRepository } from "../fakes/InMemoryRefreshTokenRepository";
import { FakeSmsProvider } from "../fakes/fakeProviders";
import { NotFoundError, ValidationError } from "../../../src/domain/errors/DomainError";
import { isPendingSubject } from "../../../src/application/auth/otp.util";

const MOBILE = "+919876543210";

describe("VerifyOtpUseCase", () => {
  function setup() {
    const otpRepo = new InMemoryOtpRepository();
    const playerRepo = new InMemoryPlayerRepository();
    const refreshTokenRepo = new InMemoryRefreshTokenRepository();
    const smsProvider = new FakeSmsProvider();
    const requestOtp = makeRequestOtpUseCase({ otpRepo, smsProvider });
    const verifyOtp = makeVerifyOtpUseCase({ otpRepo, playerRepo, refreshTokenRepo });
    return { otpRepo, playerRepo, refreshTokenRepo, smsProvider, requestOtp, verifyOtp };
  }

  it("issues tokens with a pending subject for a brand-new REGISTRATION mobile", async () => {
    const { smsProvider, requestOtp, verifyOtp } = setup();
    await requestOtp({ mobile: MOBILE, purpose: "REGISTRATION" });
    const code = smsProvider.sent[0].code;

    const result = (await verifyOtp({ mobile: MOBILE, code, purpose: "REGISTRATION" })) as {
      accessToken: string;
      isNewPlayer: boolean;
      player: null;
    };

    expect(result.isNewPlayer).toBe(true);
    expect(result.player).toBeNull();
    expect(result.accessToken).toBeTruthy();
  });

  it("rejects an incorrect code and records the attempt", async () => {
    const { otpRepo, requestOtp, verifyOtp } = setup();
    await requestOtp({ mobile: MOBILE, purpose: "REGISTRATION" });

    await expect(verifyOtp({ mobile: MOBILE, code: "000000", purpose: "REGISTRATION" })).rejects.toBeInstanceOf(
      ValidationError,
    );

    const challenge = await otpRepo.findLatestActive(MOBILE, "REGISTRATION");
    expect(challenge?.attempts).toBe(1);
  });

  it("throws NotFoundError when a LOGIN purpose is used for a mobile with no player yet", async () => {
    const { smsProvider, requestOtp, verifyOtp } = setup();
    await requestOtp({ mobile: MOBILE, purpose: "LOGIN" });
    const code = smsProvider.sent[0].code;

    await expect(verifyOtp({ mobile: MOBILE, code, purpose: "LOGIN" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the existing player and a non-pending subject when one already exists", async () => {
    const { playerRepo, smsProvider, requestOtp, verifyOtp } = setup();
    const player = await playerRepo.create({
      mobile: MOBILE,
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
    });

    await requestOtp({ mobile: MOBILE, purpose: "LOGIN" });
    const code = smsProvider.sent[0].code;
    const result = (await verifyOtp({ mobile: MOBILE, code, purpose: "LOGIN" })) as {
      isNewPlayer: boolean;
      player: { id: string } | null;
    };

    expect(result.isNewPlayer).toBe(false);
    expect(result.player?.id).toBe(player.id);
  });

  it("consumes the OTP so it cannot be replayed", async () => {
    const { smsProvider, requestOtp, verifyOtp } = setup();
    await requestOtp({ mobile: MOBILE, purpose: "REGISTRATION" });
    const code = smsProvider.sent[0].code;

    await verifyOtp({ mobile: MOBILE, code, purpose: "REGISTRATION" });

    await expect(verifyOtp({ mobile: MOBILE, code, purpose: "REGISTRATION" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("exposes pendingSubject helper consistently for unregistered mobiles", () => {
    expect(isPendingSubject(`pending:${MOBILE}`)).toBe(true);
    expect(isPendingSubject("some-uuid")).toBe(false);
  });
});
