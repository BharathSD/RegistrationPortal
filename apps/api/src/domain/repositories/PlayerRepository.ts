import type { PlayerWithMedical } from "../entities";
import type { PlayerProfileInput, VerificationStatus, PaginatedResult } from "@cricket-platform/shared";

export interface PlayerSearchFilters {
  status?: VerificationStatus;
  q?: string;
  city?: string;
  page: number;
  pageSize: number;
}

export interface CreatePlayerData extends PlayerProfileInput {
  mobile: string;
}

/**
 * Port (interface) for player persistence. The application layer depends
 * only on this contract; infrastructure/prisma/PrismaPlayerRepository.ts
 * supplies the concrete implementation at composition-root time.
 */
export interface PlayerRepository {
  findById(id: string): Promise<PlayerWithMedical | null>;
  findByMobile(mobile: string): Promise<PlayerWithMedical | null>;
  findByPlayerId(playerId: string): Promise<PlayerWithMedical | null>;
  create(data: CreatePlayerData): Promise<PlayerWithMedical>;
  update(id: string, data: Partial<PlayerProfileInput>): Promise<PlayerWithMedical>;
  updatePhoto(id: string, photoUrl: string, photoHash: string): Promise<PlayerWithMedical>;
  setVerificationStatus(
    id: string,
    status: VerificationStatus,
    extra?: { rejectionReason?: string; changeRequestNote?: string; verifiedByAdminId?: string },
  ): Promise<PlayerWithMedical>;
  assignPlayerId(id: string, playerId: string, verifiedByAdminId: string): Promise<PlayerWithMedical>;
  search(filters: PlayerSearchFilters): Promise<PaginatedResult<PlayerWithMedical>>;
  countApprovedInStateForYear(stateCode: string, year: number): Promise<number>;
  findPotentialDuplicates(player: PlayerWithMedical): Promise<PlayerWithMedical[]>;
}
