export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", code = "UNPROCESSABLE_ENTITY") {
    super(message, 422, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", code = "RATE_LIMITED") {
    super(message, 429, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code = "INTERNAL_ERROR") {
    super(message, 500, code);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
  }
}
