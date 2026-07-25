import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { MessageRepository } from "../../domain/repositories/MessageRepository";
import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import type { SmsProvider, WhatsAppProvider } from "../../domain/ports/providers";
import type { CreateCampaignInput } from "@cricket-platform/shared";
import { renderTemplate } from "./renderTemplate";
import { logger } from "../../config/logger";

export interface CreateCampaignDeps {
  playerRepo: PlayerRepository;
  messageRepo: MessageRepository;
  registrationRepo: RegistrationRepository;
  smsProvider: SmsProvider;
  whatsAppProvider: WhatsAppProvider;
}

export function makeCreateCampaignUseCase({
  playerRepo,
  messageRepo,
  registrationRepo,
  smsProvider,
  whatsAppProvider,
}: CreateCampaignDeps) {
  return async function createCampaign(input: CreateCampaignInput, createdByAdminId: string) {
    const campaign = await messageRepo.createCampaign({
      title: input.title,
      channel: input.channel,
      template: input.template,
      audienceFilter: input.audienceFilter,
      tournamentId: input.tournamentId,
      createdByAdminId,
    });

    const { items: candidates } = await playerRepo.search({
      status: input.audienceFilter.verificationStatus as any,
      city: input.audienceFilter.city,
      page: 1,
      pageSize: 1000,
    });

    let audience = candidates;
    if (input.tournamentId) {
      const roster = await registrationRepo.listByTournament(input.tournamentId);
      const registeredPlayerIds = new Set(roster.map((r) => r.playerId));
      audience = audience.filter((p) => registeredPlayerIds.has(p.id));
    }

    for (const player of audience) {
      const message = renderTemplate(input.template, { name: player.fullName, playerId: player.playerId ?? "" });
      try {
        if (input.channel === "SMS") {
          await smsProvider.sendOtp(player.mobile, message); // dev console adapter logs any string payload
          await messageRepo.logMessage({ campaignId: campaign.id, playerId: player.id, status: "SENT" });
        } else if (input.channel === "WHATSAPP") {
          const result = await whatsAppProvider.send({
            to: player.mobile,
            templateName: "bulk_campaign_message",
            params: { message },
          });
          await messageRepo.logMessage({
            campaignId: campaign.id,
            playerId: player.id,
            status: "SENT",
            providerMessageId: result.providerMessageId,
          });
        } else {
          logger.info({ to: player.email, message }, "📧 [console-email] campaign message (dev mode)");
          await messageRepo.logMessage({ campaignId: campaign.id, playerId: player.id, status: "SENT" });
        }
      } catch (err) {
        logger.error({ err, playerId: player.id }, "Campaign message delivery failed");
        await messageRepo.logMessage({ campaignId: campaign.id, playerId: player.id, status: "FAILED" });
      }
    }

    await messageRepo.markSent(campaign.id);
    return { campaign, audienceSize: audience.length };
  };
}
