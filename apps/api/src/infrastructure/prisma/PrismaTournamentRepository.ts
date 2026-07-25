import type { PrismaClient, Tournament as PrismaTournament } from "@prisma/client";
import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { Tournament, TournamentInput, TournamentStatus } from "@cricket-platform/shared";

function toDomain(t: PrismaTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    venue: t.venue,
    startDate: t.startDate.toISOString().slice(0, 10),
    endDate: t.endDate.toISOString().slice(0, 10),
    registrationOpenAt: t.registrationOpenAt.toISOString(),
    registrationCloseAt: t.registrationCloseAt.toISOString(),
    maxParticipants: t.maxParticipants,
    entryFee: Number(t.entryFee),
    feeRequired: t.feeRequired,
    rulesMarkdown: t.rulesMarkdown,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Tournament | null> {
    const t = await this.db.tournament.findUnique({ where: { id } });
    return t ? toDomain(t) : null;
  }

  async findBySlug(slug: string): Promise<Tournament | null> {
    const t = await this.db.tournament.findUnique({ where: { slug } });
    return t ? toDomain(t) : null;
  }

  async list(status?: TournamentStatus): Promise<Tournament[]> {
    const items = await this.db.tournament.findMany({
      where: status ? { status } : undefined,
      orderBy: { startDate: "asc" },
      // Safety cap, not real pagination — see the same note on
      // PrismaRegistrationRepository.listByTournament.
      take: 1000,
    });
    return items.map(toDomain);
  }

  async create(data: TournamentInput & { slug: string; createdByAdminId: string }): Promise<Tournament> {
    const t = await this.db.tournament.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        venue: data.venue,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationOpenAt: data.registrationOpenAt,
        registrationCloseAt: data.registrationCloseAt,
        maxParticipants: data.maxParticipants,
        entryFee: data.entryFee,
        feeRequired: data.feeRequired,
        rulesMarkdown: data.rulesMarkdown,
        createdByAdminId: data.createdByAdminId,
      },
    });
    return toDomain(t);
  }

  async update(id: string, data: Partial<TournamentInput>): Promise<Tournament> {
    const t = await this.db.tournament.update({ where: { id }, data });
    return toDomain(t);
  }

  async setStatus(id: string, status: TournamentStatus): Promise<Tournament> {
    const t = await this.db.tournament.update({ where: { id }, data: { status } });
    return toDomain(t);
  }

  async countConfirmedRegistrations(id: string): Promise<number> {
    return this.db.registration.count({
      where: { tournamentId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const registrations = await tx.registration.findMany({ where: { tournamentId: id }, select: { id: true } });
      const registrationIds = registrations.map((r) => r.id);
      if (registrationIds.length > 0) {
        await tx.payment.deleteMany({ where: { registrationId: { in: registrationIds } } });
      }
      await tx.checkin.deleteMany({ where: { tournamentId: id } });
      await tx.playerStat.deleteMany({ where: { tournamentId: id } });

      const campaigns = await tx.messageCampaign.findMany({ where: { tournamentId: id }, select: { id: true } });
      const campaignIds = campaigns.map((c) => c.id);
      if (campaignIds.length > 0) {
        await tx.messageLog.deleteMany({ where: { campaignId: { in: campaignIds } } });
        await tx.messageCampaign.deleteMany({ where: { id: { in: campaignIds } } });
      }

      await tx.registration.deleteMany({ where: { tournamentId: id } });
      await tx.tournament.delete({ where: { id } });
    });
  }
}
