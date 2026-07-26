import crypto from "node:crypto";
import type {
  RegistrationRepository,
  RegistrationWithRelations,
} from "../../../src/domain/repositories/RegistrationRepository";
import type { Registration, RegistrationStatus } from "@cricket-platform/shared";

export class InMemoryRegistrationRepository implements RegistrationRepository {
  registrations: RegistrationWithRelations[] = [];

  async findById(id: string): Promise<RegistrationWithRelations | null> {
    return this.registrations.find((r) => r.id === id) ?? null;
  }

  async findByPlayerAndTournament(playerId: string, tournamentId: string): Promise<Registration | null> {
    return this.registrations.find((r) => r.playerId === playerId && r.tournamentId === tournamentId) ?? null;
  }

  async findByQrToken(qrToken: string): Promise<RegistrationWithRelations | null> {
    return this.registrations.find((r) => r.qrToken === qrToken) ?? null;
  }

  async create(data: {
    playerId: string;
    tournamentId: string;
    status: RegistrationStatus;
    rulesAccepted: boolean;
    willingToBowl: boolean;
    notes?: string;
    qrToken: string;
  }): Promise<Registration> {
    const now = new Date().toISOString();
    const registration: RegistrationWithRelations = {
      id: crypto.randomUUID(),
      ...data,
      notes: data.notes ?? null,
      rulesAcceptedAt: data.rulesAccepted ? now : null,
      createdAt: now,
      updatedAt: now,
      player: { id: data.playerId, fullName: "Test Player", playerId: "AVI-000099", mobile: "+910000000000" },
      tournament: { id: data.tournamentId, name: "Test Tournament", feeRequired: false, entryFee: 0 },
    };
    this.registrations.push(registration);
    return registration;
  }

  async reactivate(
    id: string,
    data: { status: RegistrationStatus; rulesAccepted: boolean; willingToBowl: boolean; notes?: string; qrToken: string },
  ): Promise<Registration> {
    const registration = this.registrations.find((r) => r.id === id);
    if (!registration) throw new Error("not found");
    Object.assign(registration, data, {
      notes: data.notes ?? null,
      rulesAcceptedAt: data.rulesAccepted ? new Date().toISOString() : null,
    });
    return registration;
  }

  async setStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const registration = this.registrations.find((r) => r.id === id);
    if (!registration) throw new Error("not found");
    registration.status = status;
    return registration;
  }

  async listByTournament(tournamentId: string): Promise<RegistrationWithRelations[]> {
    return this.registrations.filter((r) => r.tournamentId === tournamentId);
  }

  async listByPlayer(playerId: string): Promise<RegistrationWithRelations[]> {
    return this.registrations.filter((r) => r.playerId === playerId);
  }
}
