import type { Tournament, TournamentInput, TournamentStatus } from "@cricket-platform/shared";

export interface TournamentRepository {
  findById(id: string): Promise<Tournament | null>;
  findBySlug(slug: string): Promise<Tournament | null>;
  list(status?: TournamentStatus): Promise<Tournament[]>;
  create(data: TournamentInput & { slug: string; createdByAdminId: string }): Promise<Tournament>;
  update(id: string, data: Partial<TournamentInput>): Promise<Tournament>;
  setStatus(id: string, status: TournamentStatus): Promise<Tournament>;
  countConfirmedRegistrations(id: string): Promise<number>;
}
