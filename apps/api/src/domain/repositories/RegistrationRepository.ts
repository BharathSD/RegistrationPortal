import type { Registration, RegistrationStatus } from "@cricket-platform/shared";

export interface RegistrationWithRelations extends Registration {
  player: { id: string; fullName: string; playerId: string | null; mobile: string };
  tournament: { id: string; name: string; feeRequired: boolean; entryFee: number };
}

export interface RegistrationRepository {
  findById(id: string): Promise<RegistrationWithRelations | null>;
  findByPlayerAndTournament(playerId: string, tournamentId: string): Promise<Registration | null>;
  findByQrToken(qrToken: string): Promise<RegistrationWithRelations | null>;
  create(data: {
    playerId: string;
    tournamentId: string;
    status: RegistrationStatus;
    rulesAccepted: boolean;
    qrToken: string;
  }): Promise<Registration>;
  setStatus(id: string, status: RegistrationStatus): Promise<Registration>;
  listByTournament(tournamentId: string): Promise<RegistrationWithRelations[]>;
  listByPlayer(playerId: string): Promise<RegistrationWithRelations[]>;
  /** Deletes the registration along with its payment/checkin records. */
  remove(id: string): Promise<void>;
}
