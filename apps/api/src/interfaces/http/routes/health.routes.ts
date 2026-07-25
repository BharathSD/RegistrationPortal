import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../asyncHandler";

export function healthRoutes(db: PrismaClient): Router {
  const router = Router();

  router.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

  router.get(
    "/readyz",
    asyncHandler(async (_req, res) => {
      try {
        await db.$queryRaw`SELECT 1`;
        res.status(200).json({ status: "ready" });
      } catch {
        res.status(503).json({ status: "not_ready" });
      }
    }),
  );

  return router;
}
