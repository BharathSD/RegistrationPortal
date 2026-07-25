/**
 * Domain-level error hierarchy. Framework-free — the HTTP layer maps these
 * to status codes (see interfaces/http/middleware/errorHandler.ts). Nothing
 * in application/ or domain/ should ever throw a raw Error for an expected
 * business-rule failure; it should throw one of these instead.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, identifier?: string) {
    super(`${entity} not found${identifier ? `: ${identifier}` : ""}`, "NOT_FOUND");
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN");
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Too many attempts, please try again later") {
    super(message, "RATE_LIMITED");
  }
}
