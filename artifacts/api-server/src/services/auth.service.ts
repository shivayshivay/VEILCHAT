import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JWTPayload, CreateTokenPayload, TokenPair } from "../types/auth.js";
import { redisSet, redisGet, redisDel } from "./redis.service.js";
import { UnauthorizedError } from "../utils/errors.js";

const REFRESH_TOKEN_KEY = (userId: string) => `refresh_token:${userId}`;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

export function signAccessToken(payload: CreateTokenPayload): string {
  return jwt.sign(
    { ...payload, type: "access" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number }
  );
}

export function signRefreshToken(payload: CreateTokenPayload): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number }
  );
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Access token has expired");
    }
    throw new UnauthorizedError("Invalid access token");
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Refresh token has expired");
    }
    throw new UnauthorizedError("Invalid refresh token");
  }
}

export function createTokenPair(payload: CreateTokenPayload): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function storeRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  await redisSet(REFRESH_TOKEN_KEY(userId), token, REFRESH_TOKEN_TTL);
}

export async function getStoredRefreshToken(
  userId: string
): Promise<string | null> {
  return redisGet<string>(REFRESH_TOKEN_KEY(userId));
}

export async function invalidateRefreshToken(userId: string): Promise<void> {
  await redisDel(REFRESH_TOKEN_KEY(userId));
}

export async function rotateTokens(refreshToken: string): Promise<TokenPair> {
  const payload = verifyRefreshToken(refreshToken);
  if (payload.type !== "refresh") {
    throw new UnauthorizedError("Invalid token type");
  }

  const stored = await getStoredRefreshToken(payload.sub);
  if (stored && stored !== refreshToken) {
    await invalidateRefreshToken(payload.sub);
    throw new UnauthorizedError("Refresh token reuse detected");
  }

  const { sub, phone, email, name } = payload;
  const newPair = createTokenPair({ sub, phone, email, name });
  await storeRefreshToken(payload.sub, newPair.refreshToken);
  return newPair;
}
