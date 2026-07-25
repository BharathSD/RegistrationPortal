import type { Request, Response } from "express";
import { ForbiddenError } from "../../../domain/errors/DomainError";

export interface StatsUseCases {
  getPlayerStats: (playerId: string) => Promise<unknown>;
}

export function makeStatsController(useCases: StatsUseCases) {
  return {
    async getPlayerStats(req: Request, res: Response) {
      const { playerId } = req.params;
      const isOwner = req.auth?.type === "PLAYER" && req.auth.sub === playerId;
      const isAdmin = req.auth?.type === "ADMIN";
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("You may only view your own statistics");
      }
      const stats = await useCases.getPlayerStats(playerId);
      res.status(200).json(stats);
    },
  };
}
