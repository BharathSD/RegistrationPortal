import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { makeCreatePaymentOrderUseCase } from "../../../src/application/registrations/CreatePaymentOrderUseCase";
import { InMemoryRegistrationRepository } from "../fakes/InMemoryRegistrationRepository";
import { InMemoryPaymentRepository } from "../fakes/InMemoryPaymentRepository";
import { FakePaymentProvider } from "../fakes/fakeProviders";
import { ConflictError, NotFoundError } from "../../../src/domain/errors/DomainError";
import type { RegistrationWithRelations } from "../../../src/domain/repositories/RegistrationRepository";

function setup() {
  const registrationRepo = new InMemoryRegistrationRepository();
  const paymentRepo = new InMemoryPaymentRepository();
  const paymentProvider = new FakePaymentProvider();
  const createPaymentOrder = makeCreatePaymentOrderUseCase({ registrationRepo, paymentRepo, paymentProvider });
  return { registrationRepo, paymentRepo, paymentProvider, createPaymentOrder };
}

/**
 * The fake's own `create()` hardcodes a zero-fee tournament, so payment
 * tests seed the registrations array directly to control the entry fee —
 * this mirrors what the real Prisma repository would return via its joins.
 */
function seedRegistration(
  registrationRepo: InMemoryRegistrationRepository,
  overrides: Partial<RegistrationWithRelations> = {},
): RegistrationWithRelations {
  const now = new Date().toISOString();
  const registration: RegistrationWithRelations = {
    id: crypto.randomUUID(),
    playerId: "player-1",
    tournamentId: "tournament-1",
    status: "PENDING_PAYMENT",
    rulesAccepted: true,
    rulesAcceptedAt: now,
    qrToken: crypto.randomBytes(12).toString("base64url"),
    createdAt: now,
    updatedAt: now,
    player: { id: "player-1", fullName: "Test Player", playerId: "AVI-000099", mobile: "+919876543210" },
    tournament: { id: "tournament-1", name: "Paid Cup", feeRequired: true, entryFee: 500 },
    ...overrides,
  };
  registrationRepo.registrations.push(registration);
  return registration;
}

describe("CreatePaymentOrderUseCase", () => {
  it("creates an order for the tournament's entry fee, in INR", async () => {
    const { registrationRepo, paymentRepo, paymentProvider, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo);

    const payment = await createPaymentOrder(registration.playerId, registration.id);

    expect(payment.amount).toBe(500);
    expect(payment.currency).toBe("INR");
    expect(payment.registrationId).toBe(registration.id);
    expect(paymentProvider.orders).toHaveLength(1);
    expect(paymentProvider.orders[0]).toMatchObject({ amount: 500, currency: "INR", receipt: `reg_${registration.id}` });
    expect(paymentRepo.payments).toHaveLength(1);
  });

  it("throws NotFoundError for an unknown registration id", async () => {
    const { createPaymentOrder } = setup();
    await expect(createPaymentOrder("player-1", "unknown-id")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError (not a different error) when the registration belongs to a different player", async () => {
    const { registrationRepo, paymentProvider, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo, { playerId: "owner-player" });

    await expect(createPaymentOrder("someone-else", registration.id)).rejects.toBeInstanceOf(NotFoundError);
    // and it must not have gone on to create an order for the wrong caller
    expect(paymentProvider.orders).toHaveLength(0);
  });

  it("rejects when the registration is not awaiting payment (already CONFIRMED, i.e. no fee due)", async () => {
    const { registrationRepo, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo, { status: "CONFIRMED" });

    await expect(createPaymentOrder(registration.playerId, registration.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects when the registration has already been paid and checked in", async () => {
    const { registrationRepo, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo, { status: "CHECKED_IN" });

    await expect(createPaymentOrder(registration.playerId, registration.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects when the registration has been cancelled", async () => {
    const { registrationRepo, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo, { status: "CANCELLED" });

    await expect(createPaymentOrder(registration.playerId, registration.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("is idempotent: a second call reuses the existing non-failed order instead of creating a duplicate", async () => {
    const { registrationRepo, paymentRepo, paymentProvider, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo);

    const first = await createPaymentOrder(registration.playerId, registration.id);
    const second = await createPaymentOrder(registration.playerId, registration.id);

    expect(second.id).toBe(first.id);
    expect(paymentProvider.orders).toHaveLength(1);
    expect(paymentRepo.payments).toHaveLength(1);
  });

  it("creates a fresh order when the prior attempt FAILED, instead of returning the failed one", async () => {
    const { registrationRepo, paymentRepo, paymentProvider, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo);

    const first = await createPaymentOrder(registration.playerId, registration.id);
    await paymentRepo.updateStatus(first.id, "FAILED");

    const second = await createPaymentOrder(registration.playerId, registration.id);

    expect(second.id).not.toBe(first.id);
    expect(paymentProvider.orders).toHaveLength(2);
  });

  it("uses a zero amount if somehow invoked for a registration on a tournament with no fee", async () => {
    const { registrationRepo, createPaymentOrder } = setup();
    const registration = seedRegistration(registrationRepo, {
      tournament: { id: "tournament-1", name: "Free Cup", feeRequired: false, entryFee: 0 },
    });

    const payment = await createPaymentOrder(registration.playerId, registration.id);

    expect(payment.amount).toBe(0);
  });
});
