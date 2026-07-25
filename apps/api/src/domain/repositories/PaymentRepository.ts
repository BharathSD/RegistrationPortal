import type { PaymentStatus } from "@cricket-platform/shared";

export interface PaymentRecord {
  id: string;
  registrationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerOrderId: string | null;
  providerPaymentId: string | null;
}

export interface PaymentRepository {
  create(data: {
    registrationId: string;
    amount: number;
    currency: string;
    providerOrderId: string;
  }): Promise<PaymentRecord>;
  findByRegistrationId(registrationId: string): Promise<PaymentRecord | null>;
  findByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null>;
  updateStatus(id: string, status: PaymentStatus, providerPaymentId?: string): Promise<PaymentRecord>;
}
