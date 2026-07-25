import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requireAdmin } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { createCampaignSchema } from "@cricket-platform/shared";
import type { CommunicationsUseCases } from "../controllers/communications.controller";
import { makeCommunicationsController } from "../controllers/communications.controller";

export function communicationsRoutes(useCases: CommunicationsUseCases): Router {
  const router = Router();
  const controller = makeCommunicationsController(useCases);

  router.use(authenticate, requireAdmin, requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"));

  router.post("/campaigns", validateRequest(createCampaignSchema), asyncHandler(controller.create));
  router.get("/campaigns", asyncHandler(controller.list));

  return router;
}
