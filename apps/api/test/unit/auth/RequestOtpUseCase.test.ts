import { describe, it, expect } from "vitest";
import { makeRequestOtpUseCase } from "../../../src/application/auth/RequestOtpUseCase";
import { InMemoryOtpRepository } from "../fakes/InMemoryOtpRepository";
import { FakeSmsProvider } from "../fakes/fakeProviders";
import { RateLimitError } from "../../../src/domain/errors/DomainError";

describe("RequestOtpUseCase", () => {
  function setup() {
    const otpRepo = new InMemoryOtpRepository();
    const smsProvider = new FakeSmsProvider();
    const requestOtp = makeRequestOtpUseCase({ otpRepo, smsProvider });
    return { otpRepo, smsProvider, requestOtp };
  }

  it("creates a challenge and sends the code via the SMS provider", async () => {
    const { smsProvider, requestOtp } = setup();

    const result = await requestOtp({ mobile: "+919876543210", purpose: "REGISTRATION" });

    expect(result.expiresInSeconds).toBeGreaterThan(0);
    expect(smsProvider.sent).toHaveLength(1);
    expect(smsProvider.sent[0].mobile).toBe("+919876543210");
    expect(smsProvider.sent[0].code).toMatch(/^\d{6}$/);
  });

  it("rejects a second request within the resend cooldown window", async () => {
    const { requestOtp } = setup();
    await requestOtp({ mobile: "+919876543210", purpose: "REGISTRATION" });

    await expect(requestOtp({ mobile: "+919876543210", purpose: "REGISTRATION" })).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("allows independent cooldowns per mobile number", async () => {
    const { smsProvider, requestOtp } = setup();
    await requestOtp({ mobile: "+919876543210", purpose: "REGISTRATION" });
    await requestOtp({ mobile: "+919876543299", purpose: "REGISTRATION" });

    expect(smsProvider.sent).toHaveLength(2);
  });
});
