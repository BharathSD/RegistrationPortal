import crypto from "node:crypto";
import type { CheckinRepository, CheckinRecord } from "../../../src/domain/repositories/CheckinRepository";

export class InMemoryCheckinRepository implements CheckinRepository {
  checkins: CheckinRecord[] = [];

  async create(data: {
    registrationId: string;
    tournamentId: string;
    scannedByAdminId: string;
    deviceInfo?: string;
  }): Promise<CheckinRecord> {
    const checkin: CheckinRecord = {
      id: crypto.randomUUID(),
      scannedAt: new Date(),
      deviceInfo: data.deviceInfo ?? null,
      ...data,
    };
    this.checkins.push(checkin);
    return checkin;
  }

  async countByTournament(tournamentId: string): Promise<number> {
    return this.checkins.filter((c) => c.tournamentId === tournamentId).length;
  }
}
