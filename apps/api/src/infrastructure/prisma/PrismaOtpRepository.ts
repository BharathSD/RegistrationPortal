import type { PrismaClient } from "@prisma/client";
import type { OtpRepository, OtpChallengeRecord } from "../../domain/repositories/OtpRepository";
import type { OtpPurpose } from "@cricket-platform/shared";

export class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly db: PrismaClient) {}

  async createChallenge(data: {
    mobile: string;
    codeHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    return this.db.otpChallenge.create({ data });
  }

  async findLatestActive(mobile: string, purpose: OtpPurpose): Promise<OtpChallengeRecord | null> {
    return this.db.otpChallenge.findFirst({
      where: { mobile, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.db.otpChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async markConsumed(id: string): Promise<void> {
    await this.db.otpChallenge.update({ where: { id }, data: { consumedAt: new Date() } });
  }

  async deleteExpired(before: Date): Promise<number> {
    const result = await this.db.otpChallenge.deleteMany({ where: { expiresAt: { lt: before } } });
    return result.count;
  }
}
