import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requireAdmin } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { checkinScanSchema } from "@cricket-platform/shared";
import type { CheckinUseCases } from "../controllers/checkin.controller";
import { makeCheckinController } from "../controllers/checkin.controller";

export function checkinRoutes(useCases: CheckinUseCases): Router {
  const router = Router();
  const controller = makeCheckinController(useCases);

  router.use(authenticate, requireAdmin, requireRole("ADMIN", "SCANNER"));

  router.post("/scan", validateRequest(checkinScanSchema), asyncHandler(controller.scan));
  router.get("/:tournamentId/roster", asyncHandler(controller.roster));

  return router;
}
