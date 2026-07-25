import type { NextFunction, Request, Response } from "express";
import { ADMIN_PERMISSIONS, type AdminRole } from "@cricket-platform/shared";
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

/** Restricts a route to admins holding a specific fine-grained permission (see ADMIN_PERMISSIONS). */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role as AdminRole | undefined;
    const grants = role ? ADMIN_PERMISSIONS[role] : undefined;
    if (!grants || (!grants.includes("*") && !grants.includes(permission))) {
      next(new ForbiddenError(`Missing permission: ${permission}`));
      return;
    }
    next();
  };
}
