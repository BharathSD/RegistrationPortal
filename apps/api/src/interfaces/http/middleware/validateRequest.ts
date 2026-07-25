import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../../../domain/errors/DomainError";

type Source = "body" | "query" | "params";

/**
 * Parses `req[source]` against a Zod schema and replaces it with the parsed
 * (coerced/defaulted) value on success. On failure, throws a ValidationError
 * that errorHandler.ts converts into a 422 with field-level `details` — the
 * single validation source of truth the client mirrors for UX only.
 */
export function validateRequest(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      next(new ValidationError("Request validation failed", details));
      return;
    }
    (req as any)[source] = result.data;
    next();
  };
}
