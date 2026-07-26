import crypto from "node:crypto";
import type {
  PlayerRepository,
  PlayerSearchFilters,
  CreatePlayerData,
} from "../../../src/domain/repositories/PlayerRepository";
import type { PlayerWithMedical } from "../../../src/domain/entities";
import type { PlayerProfileInput, VerificationStatus, PaginatedResult } from "@cricket-platform/shared";
import { buildPlayerId } from "@cricket-platform/shared";

export class InMemoryPlayerRepository implements PlayerRepository {
  players: PlayerWithMedical[] = [];

  async findById(id: string): Promise<PlayerWithMedical | null> {
    return this.players.find((p) => p.id === id) ?? null;
  }

  async findByMobile(mobile: string): Promise<PlayerWithMedical | null> {
    return this.players.find((p) => p.mobile === mobile) ?? null;
  }

  async findByPlayerId(playerId: string): Promise<PlayerWithMedical | null> {
    return this.players.find((p) => p.playerId === playerId) ?? null;
  }

  async create(data: CreatePlayerData): Promise<PlayerWithMedical> {
    const now = new Date().toISOString();
    const player: PlayerWithMedical = {
      id: crypto.randomUUID(),
      playerId: null,
      verificationStatus: "PENDING_VERIFICATION",
      rejectionReason: null,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
      email: null,
      photoUrl: null,
      pincode: null,
      jerseyNumberPref1: null,
      jerseyNumberPref2: null,
      jerseyName: null,
      medicalInfo: null,
      ...data,
      addressLine2: data.addressLine2 ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactRelation: data.emergencyContactRelation ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      playerType: data.playerType ?? null,
      battingStyle: data.battingStyle ?? null,
      bowlingStyle: data.bowlingStyle ?? null,
      preferredBattingPosition: data.preferredBattingPosition ?? null,
      experienceLevel: data.experienceLevel ?? null,
      dateOfBirth: typeof data.dateOfBirth === "string" ? data.dateOfBirth : new Date(data.dateOfBirth).toISOString().slice(0, 10),
    };
    this.players.push(player);
    return player;
  }

  async update(id: string, data: Partial<PlayerProfileInput>): Promise<PlayerWithMedical> {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error("not found");
    Object.assign(player, data);
    return player;
  }

  async updatePhoto(id: string, photoUrl: string): Promise<PlayerWithMedical> {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error("not found");
    player.photoUrl = photoUrl;
    return player;
  }

  async setVerificationStatus(
    id: string,
    status: VerificationStatus,
    extra?: { rejectionReason?: string; changeRequestNote?: string; verifiedByAdminId?: string },
  ): Promise<PlayerWithMedical> {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error("not found");
    player.verificationStatus = status;
    if (extra?.rejectionReason) player.rejectionReason = extra.rejectionReason;
    return player;
  }

  async assignPlayerId(id: string, playerId: string, _verifiedByAdminId: string): Promise<PlayerWithMedical> {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error("not found");
    player.playerId = playerId;
    player.verificationStatus = "VERIFIED";
    player.verifiedAt = new Date().toISOString();
    return player;
  }

  async assignNextPlayerId(id: string, verifiedByAdminId: string): Promise<PlayerWithMedical> {
    // Single-threaded JS has no real race to simulate here — this just
    // mirrors the atomic Prisma implementation's external behavior.
    const sequence = (await this.countApproved()) + 1;
    return this.assignPlayerId(id, buildPlayerId(sequence), verifiedByAdminId);
  }

  async search(filters: PlayerSearchFilters): Promise<PaginatedResult<PlayerWithMedical>> {
    const items = this.players.filter((p) => !filters.status || p.verificationStatus === filters.status);
    return { items, page: filters.page, pageSize: filters.pageSize, total: items.length };
  }

  async countApproved(): Promise<number> {
    return this.players.filter((p) => p.playerId != null).length;
  }

  async findPotentialDuplicates(player: PlayerWithMedical): Promise<PlayerWithMedical[]> {
    return this.players.filter(
      (p) =>
        p.id !== player.id &&
        ((p.fullName === player.fullName && p.dateOfBirth === player.dateOfBirth) ||
          p.emergencyContactPhone === player.emergencyContactPhone),
    );
  }

  async softDelete(id: string): Promise<void> {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error("not found");
    this.players = this.players.filter((p) => p.id !== id);
  }
}
