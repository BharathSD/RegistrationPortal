import type { PrismaClient } from "@prisma/client";
import type {
  RegistrationRepository,
  RegistrationWithRelations,
} from "../../domain/repositories/RegistrationRepository";
import type { Registration, RegistrationStatus } from "@cricket-platform/shared";

const includeRelations = {
  player: { select: { id: true, fullName: true, playerId: true, mobile: true } },
  tournament: { select: { id: true, name: true, feeRequired: true, entryFee: true } },
} as const;

function toDomain(r: any): Registration {
  return {
    id: r.id,
    playerId: r.playerId,
    tournamentId: r.tournamentId,
    status: r.status,
    rulesAccepted: r.rulesAccepted,
    rulesAcceptedAt: r.rulesAcceptedAt ? r.rulesAcceptedAt.toISOString() : null,
    qrToken: r.qrToken,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toDomainWithRelations(r: any): RegistrationWithRelations {
  return {
    ...toDomain(r),
    player: r.player,
    tournament: { ...r.tournament, entryFee: Number(r.tournament.entryFee) },
  };
}

export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<RegistrationWithRelations | null> {
    const r = await this.db.registration.findUnique({ where: { id }, include: includeRelations });
    return r ? toDomainWithRelations(r) : null;
  }

  async findByPlayerAndTournament(playerId: string, tournamentId: string): Promise<Registration | null> {
    const r = await this.db.registration.findUnique({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    return r ? toDomain(r) : null;
  }

  async findByQrToken(qrToken: string): Promise<RegistrationWithRelations | null> {
    const r = await this.db.registration.findUnique({ where: { qrToken }, include: includeRelations });
    return r ? toDomainWithRelations(r) : null;
  }

  async create(data: {
    playerId: string;
    tournamentId: string;
    status: RegistrationStatus;
    rulesAccepted: boolean;
    qrToken: string;
  }): Promise<Registration> {
    const r = await this.db.registration.create({
      data: {
        ...data,
        rulesAcceptedAt: data.rulesAccepted ? new Date() : null,
      },
    });
    return toDomain(r);
  }

  async setStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const r = await this.db.registration.update({ where: { id }, data: { status } });
    return toDomain(r);
  }

  async listByTournament(tournamentId: string): Promise<RegistrationWithRelations[]> {
    const items = await this.db.registration.findMany({
      where: { tournamentId },
      include: includeRelations,
      orderBy: { createdAt: "asc" },
    });
    return items.map(toDomainWithRelations);
  }

  async listByPlayer(playerId: string): Promise<RegistrationWithRelations[]> {
    const items = await this.db.registration.findMany({
      where: { playerId },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
    return items.map(toDomainWithRelations);
  }

  async remove(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { registrationId: id } });
      await tx.checkin.deleteMany({ where: { registrationId: id } });
      await tx.registration.delete({ where: { id } });
    });
  }
}
