import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, optionalAuthenticate, requireAdmin } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { tournamentInputSchema, tournamentUpdateSchema } from "@cricket-platform/shared";
import type { TournamentsUseCases } from "../controllers/tournaments.controller";
import { makeTournamentsController } from "../controllers/tournaments.controller";

export function tournamentsRoutes(useCases: TournamentsUseCases): Router {
  const router = Router();
  const controller = makeTournamentsController(useCases);
  const adminOnly = [authenticate, requireAdmin, requireRole("ADMIN")];

  // Public, read-only (drafts are additionally filtered out for non-admins in the controller)
  router.get("/", optionalAuthenticate, asyncHandler(controller.list));
  router.get("/:tournamentId", asyncHandler(controller.get));

  // Admin-managed
  router.post("/", ...adminOnly, validateRequest(tournamentInputSchema), asyncHandler(controller.create));
  router.patch(
    "/:tournamentId",
    ...adminOnly,
    validateRequest(tournamentUpdateSchema),
    asyncHandler(controller.update),
  );
  router.post("/:tournamentId/publish", ...adminOnly, asyncHandler(controller.publish));
  router.get("/:tournamentId/roster", ...adminOnly, asyncHandler(controller.roster));
  router.delete("/:tournamentId/roster/:registrationId", ...adminOnly, asyncHandler(controller.removeFromRoster));
  router.delete("/:tournamentId", ...adminOnly, asyncHandler(controller.remove));

  return router;
}
