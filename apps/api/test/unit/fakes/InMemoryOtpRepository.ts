import type { OtpRepository, OtpChallengeRecord } from "../../../src/domain/repositories/OtpRepository";
import type { OtpPurpose } from "@cricket-platform/shared";

export class InMemoryOtpRepository implements OtpRepository {
  challenges: OtpChallengeRecord[] = [];
  private seq = 0;

  async createChallenge(data: {
    mobile: string;
    codeHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    const record: OtpChallengeRecord = {
      id: `otp_${++this.seq}`,
      mobile: data.mobile,
      codeHash: data.codeHash,
      purpose: data.purpose,
      attempts: 0,
      expiresAt: data.expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    };
    this.challenges.push(record);
    return record;
  }

  async findLatestActive(mobile: string, purpose: OtpPurpose): Promise<OtpChallengeRecord | null> {
    const matches = this.challenges
      .filter((c) => c.mobile === mobile && c.purpose === purpose && !c.consumedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ?? null;
  }

  async incrementAttempts(id: string): Promise<void> {
    const record = this.challenges.find((c) => c.id === id);
    if (record) record.attempts += 1;
  }

  async markConsumed(id: string): Promise<void> {
    const record = this.challenges.find((c) => c.id === id);
    if (record) record.consumedAt = new Date();
  }

  async deleteExpired(before: Date): Promise<number> {
    const originalLength = this.challenges.length;
    this.challenges = this.challenges.filter((c) => c.expiresAt >= before);
    return originalLength - this.challenges.length;
  }
}
