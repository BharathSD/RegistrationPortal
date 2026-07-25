import type { NextFunction, Request, Response } from "express";
import type { AdminRole } from "@cricket-platform/shared";
import { ForbiddenError } from "../../../domain/errors/DomainError";
import "../types";

/** Restricts an already-authenticated admin route to specific roles. */
export function requireRole(...allowed: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role as AdminRole | undefined;
    if (!role || !allowed.includes(role)) {
      next(new ForbiddenError(`This action requires one of: ${allowed.join(", ")}`));
      return;
    }
    next();
  };
}
