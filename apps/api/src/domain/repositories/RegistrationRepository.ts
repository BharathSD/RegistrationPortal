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
    willingToBowl: boolean;
    notes?: string;
    qrToken: string;
  }): Promise<Registration>;
  setStatus(id: string, status: RegistrationStatus): Promise<Registration>;
  /** Un-cancels a registration in place — the (playerId, tournamentId) unique constraint means re-registering after a cancellation must reuse the same row, not insert a new one. Refreshes everything a fresh registration would set (rules acceptance, bowling/notes, a new QR token) since the old ones no longer reflect the player's current answers. */
  reactivate(
    id: string,
    data: { status: RegistrationStatus; rulesAccepted: boolean; willingToBowl: boolean; notes?: string; qrToken: string },
  ): Promise<Registration>;
  listByTournament(tournamentId: string): Promise<RegistrationWithRelations[]>;
  listByPlayer(playerId: string): Promise<RegistrationWithRelations[]>;
  /** Deletes the registration along with its payment/checkin records. */
  remove(id: string): Promise<void>;
}
