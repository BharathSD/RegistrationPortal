export interface CheckinRecord {
  id: string;
  registrationId: string;
  tournamentId: string;
  scannedByAdminId: string;
  scannedAt: Date;
  deviceInfo?: string | null;
}

export interface CheckinRepository {
  create(data: {
    registrationId: string;
    tournamentId: string;
    scannedByAdminId: string;
    deviceInfo?: string;
  }): Promise<CheckinRecord>;
  countByTournament(tournamentId: string): Promise<number>;
}
