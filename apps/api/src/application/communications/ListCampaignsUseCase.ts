import type { MessageRepository } from "../../domain/repositories/MessageRepository";

export function makeListCampaignsUseCase({ messageRepo }: { messageRepo: MessageRepository }) {
  return async function listCampaigns() {
    const campaigns = await messageRepo.listCampaigns();
    return Promise.all(
      campaigns.map(async (campaign) => ({ campaign, stats: await messageRepo.deliveryStats(campaign.id) })),
    );
  };
}
