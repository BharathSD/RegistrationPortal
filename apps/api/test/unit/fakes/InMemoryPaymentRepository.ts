import crypto from "node:crypto";
import type { PaymentRepository, PaymentRecord } from "../../../src/domain/repositories/PaymentRepository";
import type { PaymentStatus } from "@cricket-platform/shared";

export class InMemoryPaymentRepository implements PaymentRepository {
  payments: PaymentRecord[] = [];

  async create(data: {
    registrationId: string;
    amount: number;
    currency: string;
    providerOrderId: string;
  }): Promise<PaymentRecord> {
    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      status: "CREATED",
      providerPaymentId: null,
      ...data,
    };
    this.payments.push(payment);
    return payment;
  }

  async findByRegistrationId(registrationId: string): Promise<PaymentRecord | null> {
    return this.payments.find((p) => p.registrationId === registrationId) ?? null;
  }

  async updateStatus(id: string, status: PaymentStatus, providerPaymentId?: string): Promise<PaymentRecord> {
    const payment = this.payments.find((p) => p.id === id);
    if (!payment) throw new Error("not found");
    payment.status = status;
    if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
    return payment;
  }
}
