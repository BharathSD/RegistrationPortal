import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { DomainError, ValidationError } from "../../../domain/errors/DomainError";
import { logger } from "../../../config/logger";
import { env } from "../../../config/env";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
};

/** Must be registered last. Every thrown error in the app funnels through here into a single response shape. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Multer throws before our own validation layer ever sees the request
  // (e.g. an oversized file, or the client lying about content-type), so it
  // needs its own mapping to the same error shape everything else uses.
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: { code: "FILE_TOO_LARGE", message: `File must be smaller than ${env.MAX_UPLOAD_MB}MB.` },
      });
      return;
    }
    res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
    return;
  }
  if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
    res.status(415).json({ error: { code: "UNSUPPORTED_FILE_TYPE", message: "Unsupported file type." } });
    return;
  }

  if (err instanceof DomainError) {
    const status = STATUS_BY_CODE[err.code] ?? 400;
    res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error({ err, path: req.path, requestId: req.headers["x-request-id"] }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
}
