import { z } from "zod";
import { MESSAGE_CHANNELS } from "../constants/enums";

export const audienceFilterSchema = z
  .object({
    tournamentId: z.string().uuid().optional(),
    verificationStatus: z.string().optional(),
    city: z.string().optional(),
  })
  .partial();
export type AudienceFilter = z.infer<typeof audienceFilterSchema>;

export const createCampaignSchema = z.object({
  title: z.string().trim().min(3).max(150),
  channel: z.enum(MESSAGE_CHANNELS),
  template: z.string().trim().min(3).max(2000),
  audienceFilter: audienceFilterSchema,
  tournamentId: z.string().uuid().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const checkinScanSchema = z.object({
  qrToken: z.string().min(10),
  tournamentId: z.string().uuid(),
});
export type CheckinScanInput = z.infer<typeof checkinScanSchema>;
