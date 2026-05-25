import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      req.log.error({ err, stack: err.stack }, "Application error");
    } else {
      req.log.warn({ code: err.code, message: err.message }, "Client error");
    }
    res.status(err.statusCode).json({
      ok: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_JSON", message: "Invalid JSON in request body" },
    });
    return;
  }

  req.log.error({ err }, "Unhandled error");
  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
