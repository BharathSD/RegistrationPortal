import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { authenticate } from "../middleware/auth";
import type { StatsUseCases } from "../controllers/stats.controller";
import { makeStatsController } from "../controllers/stats.controller";

export function statsRoutes(useCases: StatsUseCases): Router {
  const router = Router();
  const controller = makeStatsController(useCases);

  router.get("/players/:playerId", authenticate, asyncHandler(controller.getPlayerStats));

  return router;
}
