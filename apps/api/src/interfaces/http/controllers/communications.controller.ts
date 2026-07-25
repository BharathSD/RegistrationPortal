import type { Request, Response } from "express";
import type { CreateCampaignInput } from "@cricket-platform/shared";

export interface CommunicationsUseCases {
  createCampaign: (input: CreateCampaignInput, adminId: string) => Promise<unknown>;
  listCampaigns: () => Promise<unknown>;
}

export function makeCommunicationsController(useCases: CommunicationsUseCases) {
  return {
    async create(req: Request, res: Response) {
      const result = await useCases.createCampaign(req.body, req.auth!.sub);
      res.status(202).json(result);
    },

    async list(_req: Request, res: Response) {
      const campaigns = await useCases.listCampaigns();
      res.status(200).json(campaigns);
    },
  };
}
