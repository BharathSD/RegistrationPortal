import type { PrismaClient } from "@prisma/client";
import type { CheckinRepository, CheckinRecord } from "../../domain/repositories/CheckinRepository";

export class PrismaCheckinRepository implements CheckinRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    registrationId: string;
    tournamentId: string;
    scannedByAdminId: string;
    deviceInfo?: string;
  }): Promise<CheckinRecord> {
    return this.db.checkin.create({ data });
  }

  async countByTournament(tournamentId: string): Promise<number> {
    return this.db.checkin.count({ where: { tournamentId } });
  }
}
