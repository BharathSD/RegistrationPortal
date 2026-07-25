import type { MessageChannel } from "@cricket-platform/shared";

export interface MessageCampaignRecord {
  id: string;
  title: string;
  channel: MessageChannel;
  template: string;
  audienceFilter: Record<string, unknown>;
  tournamentId?: string | null;
  createdByAdminId: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface MessageRepository {
  createCampaign(data: {
    title: string;
    channel: MessageChannel;
    template: string;
    audienceFilter: Record<string, unknown>;
    tournamentId?: string;
    createdByAdminId: string;
  }): Promise<MessageCampaignRecord>;
  markSent(campaignId: string): Promise<void>;
  listCampaigns(): Promise<MessageCampaignRecord[]>;
  logMessage(data: { campaignId: string; playerId: string; status: string; providerMessageId?: string }): Promise<void>;
  deliveryStats(campaignId: string): Promise<{ queued: number; sent: number; failed: number; delivered: number }>;
}
