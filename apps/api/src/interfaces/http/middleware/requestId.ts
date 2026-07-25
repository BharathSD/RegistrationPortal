import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/** Propagates/generates x-request-id so a single request can be traced across client, logs, and support tickets. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("x-request-id", id);
  next();
}
