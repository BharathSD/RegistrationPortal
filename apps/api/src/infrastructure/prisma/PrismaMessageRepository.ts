import type { PrismaClient, Prisma } from "@prisma/client";
import type { MessageRepository, MessageCampaignRecord } from "../../domain/repositories/MessageRepository";
import type { MessageChannel } from "@cricket-platform/shared";

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly db: PrismaClient) {}

  async createCampaign(data: {
    title: string;
    channel: MessageChannel;
    template: string;
    audienceFilter: Record<string, unknown>;
    tournamentId?: string;
    createdByAdminId: string;
  }): Promise<MessageCampaignRecord> {
    const campaign = await this.db.messageCampaign.create({
      data: {
        title: data.title,
        channel: data.channel,
        template: data.template,
        audienceFilter: data.audienceFilter as Prisma.InputJsonValue,
        tournamentId: data.tournamentId,
        createdByAdminId: data.createdByAdminId,
      },
    });
    return { ...campaign, audienceFilter: campaign.audienceFilter as Record<string, unknown> };
  }

  async markSent(campaignId: string): Promise<void> {
    await this.db.messageCampaign.update({ where: { id: campaignId }, data: { sentAt: new Date() } });
  }

  async listCampaigns(): Promise<MessageCampaignRecord[]> {
    const items = await this.db.messageCampaign.findMany({ orderBy: { createdAt: "desc" } });
    return items.map((c) => ({ ...c, audienceFilter: c.audienceFilter as Record<string, unknown> }));
  }

  async logMessage(data: {
    campaignId: string;
    playerId: string;
    status: string;
    providerMessageId?: string;
  }): Promise<void> {
    await this.db.messageLog.create({
      data: {
        campaignId: data.campaignId,
        playerId: data.playerId,
        status: data.status as any,
        providerMessageId: data.providerMessageId,
      },
    });
  }

  async deliveryStats(
    campaignId: string,
  ): Promise<{ queued: number; sent: number; failed: number; delivered: number }> {
    const [queued, sent, failed, delivered] = await Promise.all([
      this.db.messageLog.count({ where: { campaignId, status: "QUEUED" } }),
      this.db.messageLog.count({ where: { campaignId, status: "SENT" } }),
      this.db.messageLog.count({ where: { campaignId, status: "FAILED" } }),
      this.db.messageLog.count({ where: { campaignId, status: "DELIVERED" } }),
    ]);
    return { queued, sent, failed, delivered };
  }
}
