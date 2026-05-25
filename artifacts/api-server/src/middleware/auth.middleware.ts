import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JWTPayload } from "../types/auth.js";
import { UnauthorizedError } from "../utils/errors.js";

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieToken = (req.cookies as Record<string, string | undefined>)?.["access_token"];
  return cookieToken ?? null;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorizedError("Missing authentication token"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    if (payload.type !== "access") {
      next(new UnauthorizedError("Invalid token type"));
      return;
    }
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token has expired"));
    } else {
      next(new UnauthorizedError("Invalid token"));
    }
  }
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    if (payload.type === "access") {
      req.user = payload;
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}

export function requireRole(_role: string) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // Role-based access control placeholder — extend when roles are added to JWT
    next();
  };
}
