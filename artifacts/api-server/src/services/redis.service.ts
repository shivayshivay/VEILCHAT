import { Redis } from "@upstash/redis";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!_redis) {
    _redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info("Upstash Redis client initialized");
  }
  return _redis;
}

export function isRedisConfigured(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export async function redisHealthCheck(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
  return true;
}

export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(key);
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function redisDel(...keys: string[]): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  await redis.del(...keys);
  return true;
}

export async function redisExists(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  return (await redis.exists(key)) === 1;
}

export async function redisIncr(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return redis.incr(key);
}

export async function redisExpire(key: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.expire(key, ttlSeconds);
}
