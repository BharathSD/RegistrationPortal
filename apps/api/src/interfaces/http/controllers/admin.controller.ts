import type { Request, Response } from "express";
import type { PlayerSearchFilters } from "../../../domain/repositories/PlayerRepository";
import type { AssignCricketProfileInput, DuplicateFlagStatus } from "@cricket-platform/shared";

export interface AdminUseCases {
  searchPlayers: (filters: PlayerSearchFilters) => Promise<unknown>;
  getPlayerDetail: (playerId: string) => Promise<unknown>;
  approvePlayer: (playerId: string, adminId: string) => Promise<unknown>;
  rejectPlayer: (playerId: string, reason: string, adminId: string) => Promise<unknown>;
  requestChanges: (playerId: string, message: string, adminId: string) => Promise<unknown>;
  assignCricketProfile: (playerId: string, input: AssignCricketProfileInput, adminId: string) => Promise<unknown>;
  listDuplicateFlags: () => Promise<unknown>;
  resolveDuplicateFlag: (flagId: string, resolution: DuplicateFlagStatus, adminId: string) => Promise<unknown>;
  deletePlayer: (playerId: string) => Promise<void>;
}

export function makeAdminController(useCases: AdminUseCases) {
  return {
    async searchPlayers(req: Request, res: Response) {
      const result = await useCases.searchPlayers(req.query as unknown as PlayerSearchFilters);
      res.status(200).json(result);
    },

    async getPlayerDetail(req: Request, res: Response) {
      const player = await useCases.getPlayerDetail(req.params.playerId);
      res.status(200).json(player);
    },

    async approve(req: Request, res: Response) {
      const player = await useCases.approvePlayer(req.params.playerId, req.auth!.sub);
      res.status(200).json(player);
    },

    async reject(req: Request, res: Response) {
      const player = await useCases.rejectPlayer(req.params.playerId, req.body.reason, req.auth!.sub);
      res.status(200).json(player);
    },

    async requestChanges(req: Request, res: Response) {
      const player = await useCases.requestChanges(req.params.playerId, req.body.message, req.auth!.sub);
      res.status(200).json(player);
    },

    async assignCricketProfile(req: Request, res: Response) {
      const player = await useCases.assignCricketProfile(req.params.playerId, req.body, req.auth!.sub);
      res.status(200).json(player);
    },

    async listDuplicates(_req: Request, res: Response) {
      const flags = await useCases.listDuplicateFlags();
      res.status(200).json(flags);
    },

    async resolveDuplicate(req: Request, res: Response) {
      const flag = await useCases.resolveDuplicateFlag(req.params.flagId, req.body.resolution, req.auth!.sub);
      res.status(200).json(flag);
    },

    async deletePlayer(req: Request, res: Response) {
      await useCases.deletePlayer(req.params.playerId);
      res.status(204).send();
    },
  };
}
