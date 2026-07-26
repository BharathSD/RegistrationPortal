import express, { type Express } from "express";
import type { Container } from "../../../container";

import { authRoutes } from "./auth.routes";
import { playersRoutes } from "./players.routes";
import { adminRoutes } from "./admin.routes";
import { tournamentsRoutes } from "./tournaments.routes";
import { registrationsRoutes } from "./registrations.routes";
import { paymentsRoutes } from "./payments.routes";
import { communicationsRoutes } from "./communications.routes";
import { checkinRoutes } from "./checkin.routes";
import { statsRoutes } from "./stats.routes";
import { healthRoutes } from "./health.routes";

/** Mounts /healthz+/readyz at the root and every feature router under /api/v1. */
export function mountRoutes(app: Express, container: Container): void {
  app.use("/", healthRoutes(container.prisma));

  const v1 = express.Router();
  v1.use("/auth", authRoutes(container.useCases.auth));
  v1.use("/players", playersRoutes(container.useCases.players, container.playerRepo));
  v1.use("/admin", adminRoutes(container.useCases.admin));
  v1.use("/tournaments", tournamentsRoutes(container.useCases.tournaments));
  v1.use("/registrations", registrationsRoutes(container.useCases.registrations, container.playerRepo));
  v1.use("/payments", paymentsRoutes(container.useCases.payments, container.paymentProvider));
  v1.use("/communications", communicationsRoutes(container.useCases.communications));
  v1.use("/checkin", checkinRoutes(container.useCases.checkin));
  v1.use("/stats", statsRoutes(container.useCases.stats));
  app.use("/api/v1", v1);
}
