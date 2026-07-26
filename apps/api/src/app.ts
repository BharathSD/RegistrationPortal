import express, { type Express } from "express";

import { buildContainer } from "./container";
import { applyGlobalMiddleware } from "./interfaces/http/globalMiddleware";
import { mountApiDocs } from "./interfaces/http/docs";
import { mountRoutes } from "./interfaces/http/routes";
import { errorHandler, notFoundHandler } from "./interfaces/http/middleware/errorHandler";

/**
 * App entry point: wires the global middleware stack, the composition root
 * (see container.ts), routes, and API docs together in order. Each concern
 * lives in its own file — this function just sequences them.
 */
export function createApp(): Express {
  const app = express();

  applyGlobalMiddleware(app);

  const container = buildContainer();
  mountRoutes(app, container);
  mountApiDocs(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
