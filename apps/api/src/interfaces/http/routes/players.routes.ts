import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requirePlayer } from "../middleware/auth";
import { photoUpload } from "../middleware/upload";
import { playerSelfInputSchema } from "@cricket-platform/shared";
import type { PlayersUseCases } from "../controllers/players.controller";
import { makePlayersController } from "../controllers/players.controller";

export function playersRoutes(useCases: PlayersUseCases): Router {
  const router = Router();
  const controller = makePlayersController(useCases);

  router.use(authenticate, requirePlayer);

  router.post("/register", validateRequest(playerSelfInputSchema), asyncHandler(controller.register));
  router.get("/me", asyncHandler(controller.getMe));
  router.patch("/me", validateRequest(playerSelfInputSchema.partial()), asyncHandler(controller.updateMe));
  router.post("/me/photo", photoUpload.single("photo"), asyncHandler(controller.uploadPhoto));

  return router;
}
