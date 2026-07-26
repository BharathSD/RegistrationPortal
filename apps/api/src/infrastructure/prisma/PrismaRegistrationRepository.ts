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
    willingToBowl: r.willingToBowl,
    notes: r.notes,
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
    willingToBowl: boolean;
    notes?: string;
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

  async reactivate(
    id: string,
    data: { status: RegistrationStatus; rulesAccepted: boolean; willingToBowl: boolean; notes?: string; qrToken: string },
  ): Promise<Registration> {
    const r = await this.db.registration.update({
      where: { id },
      // Unlike create(), an omitted field on update() means "leave the
      // existing value alone" — notes must be nulled explicitly or a stale
      // note from the cancelled registration would linger when the player
      // re-registers without one this time.
      data: { ...data, notes: data.notes ?? null, rulesAcceptedAt: data.rulesAccepted ? new Date() : null },
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
      // Safety cap, not real pagination: this backs the admin roster/
      // check-in screens, which render the full list at once today. A
      // single tournament realistically won't clear a few thousand
      // registrations, but an unbounded findMany() here was a genuine
      // cliff waiting to happen at "hundreds of tournaments" scale — cursor
      // pagination with matching UI is the proper fix, tracked separately.
      take: 5000,
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
