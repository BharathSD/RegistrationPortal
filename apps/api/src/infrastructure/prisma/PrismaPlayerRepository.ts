import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  PlayerRepository,
  PlayerSearchFilters,
  CreatePlayerData,
} from "../../domain/repositories/PlayerRepository";
import type { PlayerWithMedical } from "../../domain/entities";
import type { PlayerProfileInput, VerificationStatus, PaginatedResult } from "@cricket-platform/shared";
import { toDomainPlayer } from "./mappers";

const includeMedical = { medicalInfo: true } as const;

export class PrismaPlayerRepository implements PlayerRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PlayerWithMedical | null> {
    const player = await this.db.player.findUnique({ where: { id }, include: includeMedical });
    return player ? toDomainPlayer(player) : null;
  }

  async findByMobile(mobile: string): Promise<PlayerWithMedical | null> {
    const player = await this.db.player.findUnique({ where: { mobile }, include: includeMedical });
    return player ? toDomainPlayer(player) : null;
  }

  async findByPlayerId(playerId: string): Promise<PlayerWithMedical | null> {
    const player = await this.db.player.findUnique({ where: { playerId }, include: includeMedical });
    return player ? toDomainPlayer(player) : null;
  }

  async create(data: CreatePlayerData): Promise<PlayerWithMedical> {
    const player = await this.db.player.create({
      data: {
        mobile: data.mobile,
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        email: data.email ?? null,
        // Not collected at registration — left null ("unassigned") until an
        // admin assigns the player's cricket profile (see AssignCricketProfileUseCase).
        cricketRole: data.cricketRole ?? null,
        battingStyle: data.battingStyle ?? null,
        bowlingStyle: data.bowlingStyle ?? null,
        preferredBattingPosition: data.preferredBattingPosition ?? null,
        experienceLevel: data.experienceLevel ?? null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactRelation: data.emergencyContactRelation ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        jerseySize: data.jerseySize,
        jerseyNumberPref1: data.jerseyNumberPref1 ?? null,
        jerseyNumberPref2: data.jerseyNumberPref2 ?? null,
        jerseyName: data.jerseyName ?? null,
        medicalInfo: data.medicalInfo
          ? {
              create: {
                bloodGroup: data.medicalInfo.bloodGroup ?? null,
                allergies: data.medicalInfo.allergies ?? null,
                conditions: data.medicalInfo.conditions ?? null,
                medication: data.medicalInfo.medication ?? null,
              },
            }
          : undefined,
      },
      include: includeMedical,
    });
    return toDomainPlayer(player);
  }

  async update(id: string, data: Partial<PlayerProfileInput>): Promise<PlayerWithMedical> {
    const { medicalInfo, dateOfBirth, ...rest } = data;
    const player = await this.db.player.update({
      where: { id },
      data: {
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        ...(medicalInfo
          ? {
              medicalInfo: {
                upsert: {
                  create: {
                    bloodGroup: medicalInfo.bloodGroup ?? null,
                    allergies: medicalInfo.allergies ?? null,
                    conditions: medicalInfo.conditions ?? null,
                    medication: medicalInfo.medication ?? null,
                  },
                  update: {
                    bloodGroup: medicalInfo.bloodGroup ?? null,
                    allergies: medicalInfo.allergies ?? null,
                    conditions: medicalInfo.conditions ?? null,
                    medication: medicalInfo.medication ?? null,
                  },
                },
              },
            }
          : {}),
      },
      include: includeMedical,
    });
    return toDomainPlayer(player);
  }

  async updatePhoto(id: string, photoUrl: string, photoHash: string): Promise<PlayerWithMedical> {
    const player = await this.db.player.update({
      where: { id },
      data: { photoUrl, photoHash },
      include: includeMedical,
    });
    return toDomainPlayer(player);
  }

  async setVerificationStatus(
    id: string,
    status: VerificationStatus,
    extra?: { rejectionReason?: string; changeRequestNote?: string; verifiedByAdminId?: string },
  ): Promise<PlayerWithMedical> {
    const player = await this.db.player.update({
      where: { id },
      data: {
        verificationStatus: status,
        rejectionReason: extra?.rejectionReason ?? null,
        changeRequestNote: extra?.changeRequestNote ?? null,
        ...(extra?.verifiedByAdminId ? { verifiedByAdminId: extra.verifiedByAdminId } : {}),
      },
      include: includeMedical,
    });
    return toDomainPlayer(player);
  }

  async assignPlayerId(id: string, playerId: string, verifiedByAdminId: string): Promise<PlayerWithMedical> {
    const player = await this.db.player.update({
      where: { id },
      data: {
        playerId,
        verificationStatus: "VERIFIED",
        verifiedByAdminId,
        verifiedAt: new Date(),
        rejectionReason: null,
        changeRequestNote: null,
      },
      include: includeMedical,
    });
    return toDomainPlayer(player);
  }

  async search(filters: PlayerSearchFilters): Promise<PaginatedResult<PlayerWithMedical>> {
    const where: Prisma.PlayerWhereInput = {
      deletedAt: null,
      ...(filters.status ? { verificationStatus: filters.status } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
      ...(filters.q
        ? {
            OR: [
              { fullName: { contains: filters.q, mode: "insensitive" } },
              { mobile: { contains: filters.q } },
              { playerId: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.player.findMany({
        where,
        include: includeMedical,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.db.player.count({ where }),
    ]);

    return {
      items: items.map(toDomainPlayer),
      page: filters.page,
      pageSize: filters.pageSize,
      total,
    };
  }

  async countApprovedInStateForYear(stateCode: string, year: number): Promise<number> {
    const yy = String(year % 100).padStart(2, "0");
    return this.db.player.count({
      where: { playerId: { startsWith: `CKT-${stateCode}-${yy}-` } },
    });
  }

  async findPotentialDuplicates(player: PlayerWithMedical): Promise<PlayerWithMedical[]> {
    const matches = await this.db.player.findMany({
      where: {
        id: { not: player.id },
        deletedAt: null,
        OR: [
          {
            AND: [
              { fullName: { equals: player.fullName, mode: "insensitive" } },
              { dateOfBirth: new Date(player.dateOfBirth) },
            ],
          },
          { emergencyContactPhone: player.emergencyContactPhone },
        ],
      },
      include: includeMedical,
      take: 10,
    });
    return matches.map(toDomainPlayer);
  }
}
