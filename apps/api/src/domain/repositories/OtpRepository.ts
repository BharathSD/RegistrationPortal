import type { OtpPurpose } from "@cricket-platform/shared";

export interface OtpChallengeRecord {
  id: string;
  mobile: string;
  codeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface OtpRepository {
  createChallenge(data: {
    mobile: string;
    codeHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord>;
  findLatestActive(mobile: string, purpose: OtpPurpose): Promise<OtpChallengeRecord | null>;
  incrementAttempts(id: string): Promise<void>;
  markConsumed(id: string): Promise<void>;
  deleteExpired(before: Date): Promise<number>;
}
