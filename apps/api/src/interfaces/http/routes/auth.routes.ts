import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { otpRateLimiter, loginRateLimiter } from "../middleware/rateLimiter";
import { requestOtpSchema, verifyOtpSchema, adminLoginSchema } from "@cricket-platform/shared";
import type { AuthUseCases } from "../controllers/auth.controller";
import { makeAuthController } from "../controllers/auth.controller";

export function authRoutes(useCases: AuthUseCases): Router {
  const router = Router();
  const controller = makeAuthController(useCases);

  router.post("/otp/request", otpRateLimiter, validateRequest(requestOtpSchema), asyncHandler(controller.requestOtp));
  router.post("/otp/verify", otpRateLimiter, validateRequest(verifyOtpSchema), asyncHandler(controller.verifyOtp));
  // No body validation here: the refresh token now comes from the httpOnly
  // cookie (see cookies.ts), not the request body.
  router.post("/token/refresh", asyncHandler(controller.refreshToken));
  router.post("/logout", asyncHandler(controller.logout));
  router.post(
    "/admin/login",
    loginRateLimiter,
    validateRequest(adminLoginSchema),
    asyncHandler(controller.adminLogin),
  );

  return router;
}
