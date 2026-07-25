import type { PrismaClient } from "@prisma/client";
import type { PaymentRepository, PaymentRecord } from "../../domain/repositories/PaymentRepository";
import type { PaymentStatus } from "@cricket-platform/shared";

function toDomain(p: any): PaymentRecord {
  return { ...p, amount: Number(p.amount) };
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    registrationId: string;
    amount: number;
    currency: string;
    providerOrderId: string;
  }): Promise<PaymentRecord> {
    const payment = await this.db.payment.create({ data });
    return toDomain(payment);
  }

  async findByRegistrationId(registrationId: string): Promise<PaymentRecord | null> {
    const payment = await this.db.payment.findUnique({ where: { registrationId } });
    return payment ? toDomain(payment) : null;
  }

  async findByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null> {
    const payment = await this.db.payment.findFirst({ where: { providerOrderId } });
    return payment ? toDomain(payment) : null;
  }

  async updateStatus(id: string, status: PaymentStatus, providerPaymentId?: string): Promise<PaymentRecord> {
    const payment = await this.db.payment.update({
      where: { id },
      data: { status, ...(providerPaymentId ? { providerPaymentId } : {}) },
    });
    return toDomain(payment);
  }
}
