import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requirePlayer } from "../middleware/auth";
import { registerForTournamentSchema } from "@cricket-platform/shared";
import type { RegistrationsUseCases } from "../controllers/registrations.controller";
import { makeRegistrationsController } from "../controllers/registrations.controller";

export function registrationsRoutes(useCases: RegistrationsUseCases): Router {
  const router = Router();
  const controller = makeRegistrationsController(useCases);

  router.use(authenticate, requirePlayer);

  router.post("/", validateRequest(registerForTournamentSchema), asyncHandler(controller.register));
  router.get("/me", asyncHandler(controller.listMine));
  router.post("/:registrationId/pay", asyncHandler(controller.pay));
  router.post("/:registrationId/cancel", asyncHandler(controller.cancel));

  return router;
}
