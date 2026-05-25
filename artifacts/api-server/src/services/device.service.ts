import { redisGet, redisSet, redisDel } from "./redis.service.js";
import type { DeviceInfo, DevicePlatform, DeviceSession } from "../types/auth.js";
import { logger } from "../lib/logger.js";

const DEVICE_KEY = (userId: string, deviceId: string) =>
  `device:${userId}:${deviceId}`;
const USER_DEVICES_KEY = (userId: string) => `devices:${userId}`;
const DEVICE_TTL = 30 * 24 * 60 * 60; // 30 days

export async function registerDevice(
  userId: string,
  deviceId: string,
  platform: DevicePlatform,
  fcmToken?: string | null
): Promise<DeviceSession> {
  const now = new Date().toISOString();

  const existing = await redisGet<DeviceSession>(DEVICE_KEY(userId, deviceId));

  const session: DeviceSession = {
    userId,
    deviceId,
    platform,
    fcmToken: fcmToken ?? existing?.fcmToken ?? null,
    lastSeen: now,
    registeredAt: existing?.registeredAt ?? now,
  };

  await redisSet(DEVICE_KEY(userId, deviceId), session, DEVICE_TTL);

  const existingIds = await redisGet<string[]>(USER_DEVICES_KEY(userId)) ?? [];
  if (!existingIds.includes(deviceId)) {
    await redisSet(USER_DEVICES_KEY(userId), [...existingIds, deviceId], DEVICE_TTL);
  }

  logger.debug({ userId, deviceId, platform }, "Device registered");
  return session;
}

export async function getDevice(
  userId: string,
  deviceId: string
): Promise<DeviceSession | null> {
  return redisGet<DeviceSession>(DEVICE_KEY(userId, deviceId));
}

export async function listUserDevices(userId: string): Promise<DeviceInfo[]> {
  const deviceIds = await redisGet<string[]>(USER_DEVICES_KEY(userId)) ?? [];
  const sessions = await Promise.all(
    deviceIds.map((id) => redisGet<DeviceSession>(DEVICE_KEY(userId, id)))
  );
  return sessions.filter((s): s is DeviceSession => s !== null).map(
    ({ deviceId, platform, fcmToken, lastSeen, registeredAt }) => ({
      deviceId,
      platform,
      fcmToken,
      lastSeen,
      registeredAt,
    })
  );
}

export async function updateDeviceLastSeen(
  userId: string,
  deviceId: string
): Promise<void> {
  const session = await getDevice(userId, deviceId);
  if (!session) return;
  await redisSet(
    DEVICE_KEY(userId, deviceId),
    { ...session, lastSeen: new Date().toISOString() },
    DEVICE_TTL
  );
}

export async function removeDevice(
  userId: string,
  deviceId: string
): Promise<void> {
  await redisDel(DEVICE_KEY(userId, deviceId));
  const existingIds = await redisGet<string[]>(USER_DEVICES_KEY(userId)) ?? [];
  const filtered = existingIds.filter((id) => id !== deviceId);
  if (filtered.length > 0) {
    await redisSet(USER_DEVICES_KEY(userId), filtered, DEVICE_TTL);
  } else {
    await redisDel(USER_DEVICES_KEY(userId));
  }
}

export async function removeAllUserDevices(userId: string): Promise<void> {
  const deviceIds = await redisGet<string[]>(USER_DEVICES_KEY(userId)) ?? [];
  await Promise.all(
    deviceIds.map((id) => redisDel(DEVICE_KEY(userId, id)))
  );
  await redisDel(USER_DEVICES_KEY(userId));
}
