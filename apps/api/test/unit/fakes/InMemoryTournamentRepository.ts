import crypto from "node:crypto";
import type { TournamentRepository } from "../../../src/domain/repositories/TournamentRepository";
import type { Tournament, TournamentInput, TournamentStatus } from "@cricket-platform/shared";

export class InMemoryTournamentRepository implements TournamentRepository {
  tournaments: Tournament[] = [];
  confirmedCounts = new Map<string, number>();

  async findById(id: string): Promise<Tournament | null> {
    return this.tournaments.find((t) => t.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Tournament | null> {
    return this.tournaments.find((t) => t.slug === slug) ?? null;
  }

  async list(status?: TournamentStatus): Promise<Tournament[]> {
    return status ? this.tournaments.filter((t) => t.status === status) : this.tournaments;
  }

  async create(data: TournamentInput & { slug: string; createdByAdminId: string }): Promise<Tournament> {
    const now = new Date().toISOString();
    const tournament: Tournament = {
      id: crypto.randomUUID(),
      status: "DRAFT",
      createdAt: now,
      description: data.description ?? null,
      maxParticipants: data.maxParticipants ?? null,
      rulesMarkdown: data.rulesMarkdown ?? null,
      ...data,
      startDate: new Date(data.startDate).toISOString().slice(0, 10),
      endDate: new Date(data.endDate).toISOString().slice(0, 10),
      registrationOpenAt: new Date(data.registrationOpenAt).toISOString(),
      registrationCloseAt: new Date(data.registrationCloseAt).toISOString(),
    };
    this.tournaments.push(tournament);
    return tournament;
  }

  async update(id: string, data: Partial<TournamentInput>): Promise<Tournament> {
    const tournament = this.tournaments.find((t) => t.id === id);
    if (!tournament) throw new Error("not found");
    Object.assign(tournament, data);
    return tournament;
  }

  async setStatus(id: string, status: TournamentStatus): Promise<Tournament> {
    const tournament = this.tournaments.find((t) => t.id === id);
    if (!tournament) throw new Error("not found");
    tournament.status = status;
    return tournament;
  }

  async countConfirmedRegistrations(id: string): Promise<number> {
    return this.confirmedCounts.get(id) ?? 0;
  }
}
