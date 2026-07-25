import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requireAdmin } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  assignCricketProfileSchema,
  playerSearchQuerySchema,
  rejectPlayerSchema,
  requestChangesSchema,
} from "@cricket-platform/shared";
import { z } from "zod";
import type { AdminUseCases } from "../controllers/admin.controller";
import { makeAdminController } from "../controllers/admin.controller";

const resolveDuplicateSchema = z.object({ resolution: z.enum(["DISMISSED", "CONFIRMED_MERGED"]) });

export function adminRoutes(useCases: AdminUseCases): Router {
  const router = Router();
  const controller = makeAdminController(useCases);

  router.use(authenticate, requireAdmin, requireRole("ADMIN"));

  router.get("/players", validateRequest(playerSearchQuerySchema, "query"), asyncHandler(controller.searchPlayers));
  router.get("/players/:playerId", asyncHandler(controller.getPlayerDetail));
  router.post("/players/:playerId/approve", asyncHandler(controller.approve));
  router.post("/players/:playerId/reject", validateRequest(rejectPlayerSchema), asyncHandler(controller.reject));
  router.post(
    "/players/:playerId/request-changes",
    validateRequest(requestChangesSchema),
    asyncHandler(controller.requestChanges),
  );
  router.patch(
    "/players/:playerId/cricket-profile",
    validateRequest(assignCricketProfileSchema),
    asyncHandler(controller.assignCricketProfile),
  );
  router.delete("/players/:playerId", asyncHandler(controller.deletePlayer));

  router.get("/duplicates", asyncHandler(controller.listDuplicates));
  router.post(
    "/duplicates/:flagId/resolve",
    validateRequest(resolveDuplicateSchema),
    asyncHandler(controller.resolveDuplicate),
  );

  return router;
}
