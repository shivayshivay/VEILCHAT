import type { Request, Response, NextFunction } from "express";
import { db, usersTable, eq, or } from "@workspace/db";
import { verifyFirebaseIdToken, isFirebaseConfigured } from "../services/firebase.service.js";
import {
  createTokenPair,
  storeRefreshToken,
  invalidateRefreshToken,
  rotateTokens,
} from "../services/auth.service.js";
import { registerDevice, removeAllUserDevices } from "../services/device.service.js";
import { ok, created } from "../utils/response.js";
import {
  UnauthorizedError,
  BadRequestError,
  ServiceUnavailableError,
} from "../utils/errors.js";
import { logger } from "../lib/logger.js";
import type { FirebaseAuthInput, RefreshTokenInput, SetupProfileInput, RegisterDeviceInput } from "../validators/auth.validator.js";
import type { AuthenticatedUser } from "../types/auth.js";

const AVATAR_COLORS = [
  "#00F5D4", "#7C3AED", "#F59E0B", "#EF4444",
  "#3B82F6", "#10B981", "#EC4899", "#8B5CF6",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function requireDb() {
  if (!db) {
    throw new ServiceUnavailableError(
      "Database is not configured. Set DATABASE_URL to enable this endpoint."
    );
  }
  return db;
}

function toAuthenticatedUser(user: typeof usersTable.$inferSelect): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    phone: user.phone,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    avatarColor: user.avatarColor,
    isVerified: user.isVerified,
    isOnline: user.isOnline,
    createdAt: user.createdAt,
  };
}

export async function verifyFirebase(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!isFirebaseConfigured()) {
      throw new ServiceUnavailableError("Firebase authentication is not configured");
    }

    const database = requireDb();
    const { idToken, deviceId, platform, fcmToken } = req.body as FirebaseAuthInput;

    let firebaseUser: { uid: string; phone_number?: string; email?: string; display_name?: string };
    try {
      firebaseUser = await verifyFirebaseIdToken(idToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired Firebase token");
    }

    const { uid, phone_number: phone, email, display_name: displayName } = firebaseUser;

    const conditions = [eq(usersTable.supabaseUid, uid)];
    if (phone) conditions.push(eq(usersTable.phone, phone));
    if (email) conditions.push(eq(usersTable.email, email));

    let [existingUser] = await database
      .select()
      .from(usersTable)
      .where(or(...conditions))
      .limit(1);

    let isNewUser = false;

    if (!existingUser) {
      isNewUser = true;
      const [newUser] = await database
        .insert(usersTable)
        .values({
          supabaseUid: uid,
          phone: phone ?? null,
          email: email ?? null,
          name: displayName ?? (phone ? phone.slice(-4) : "User"),
          avatarColor: randomAvatarColor(),
          isVerified: true,
          fcmToken: fcmToken ?? null,
        })
        .returning();
      existingUser = newUser;
      logger.info({ userId: newUser.id, uid }, "New user registered via Firebase");
    } else {
      const updates: Partial<typeof usersTable.$inferInsert> = {
        updatedAt: new Date(),
        isOnline: true,
        lastSeen: new Date(),
      };
      if (fcmToken !== undefined) updates.fcmToken = fcmToken;
      if (!existingUser.supabaseUid) updates.supabaseUid = uid;

      const [updated] = await database
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, existingUser.id))
        .returning();
      existingUser = updated;
      logger.info({ userId: existingUser.id }, "Existing user authenticated via Firebase");
    }

    const tokenPayload = {
      sub: existingUser.id,
      phone: existingUser.phone ?? undefined,
      email: existingUser.email ?? undefined,
      name: existingUser.name,
    };

    const tokens = createTokenPair(tokenPayload);
    await storeRefreshToken(existingUser.id, tokens.refreshToken);

    if (deviceId && platform) {
      await registerDevice(existingUser.id, deviceId, platform, fcmToken).catch(
        (err) => logger.warn({ err }, "Device registration failed — continuing")
      );
    }

    const status = isNewUser ? 201 : 200;
    res.status(status).json(
      isNewUser
        ? created({ tokens, user: toAuthenticatedUser(existingUser), isNewUser: true })
        : ok({ tokens, user: toAuthenticatedUser(existingUser), isNewUser: false })
    );
  } catch (err) {
    next(err);
  }
}

export async function refreshTokens(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as RefreshTokenInput;
    const refreshToken =
      body?.refreshToken ??
      (req.cookies as Record<string, string | undefined>)?.["refresh_token"];

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    const newTokens = await rotateTokens(refreshToken);
    res.json(ok(newTokens));
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;

    await invalidateRefreshToken(userId);
    await removeAllUserDevices(userId).catch((err) =>
      logger.warn({ err }, "Device cleanup failed during logout — continuing")
    );

    if (db) {
      await db
        .update(usersTable)
        .set({ isOnline: false, lastSeen: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.id, userId))
        .catch((err: unknown) => logger.warn({ err }, "Presence update failed during logout"));
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json(ok({ message: "Logged out successfully" }));
  } catch (err) {
    next(err);
  }
}

export async function setupProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = requireDb();
    const userId = req.user!.sub;
    const { name, username, bio, avatarColor } = req.body as SetupProfileInput;

    if (username) {
      const [conflict] = await database
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

      if (conflict && conflict.id !== userId) {
        throw new BadRequestError("Username is already taken");
      }
    }

    const [updated] = await database
      .update(usersTable)
      .set({
        name,
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatarColor !== undefined && { avatarColor }),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json(ok(toAuthenticatedUser(updated)));
  } catch (err) {
    next(err);
  }
}

export async function registerUserDevice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { deviceId, platform, fcmToken } = req.body as RegisterDeviceInput;

    const session = await registerDevice(userId, deviceId, platform, fcmToken);

    if (fcmToken && db) {
      await db
        .update(usersTable)
        .set({ fcmToken, updatedAt: new Date() })
        .where(eq(usersTable.id, userId))
        .catch((err: unknown) => logger.warn({ err }, "FCM token DB update failed — continuing"));
    }

    res.json(ok(session));
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = requireDb();
    const userId = req.user!.sub;

    const [user] = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("User not found — token may be stale");
    }

    res.json(ok(toAuthenticatedUser(user)));
  } catch (err) {
    next(err);
  }
}
