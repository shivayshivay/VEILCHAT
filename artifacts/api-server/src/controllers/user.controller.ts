import type { Request, Response, NextFunction } from "express";
import { db, usersTable, eq } from "@workspace/db";
import { ServiceUnavailableError, NotFoundError } from "../utils/errors.js";
import { ok } from "../utils/response.js";
import type { UpdateUserInput } from "../validators/user.validator.js";

function requireDb() {
  if (!db) {
    throw new ServiceUnavailableError(
      "Database is not configured. Set DATABASE_URL to enable this endpoint."
    );
  }
  return db;
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
      next(new NotFoundError("User not found"));
      return;
    }

    const { fcmToken, supabaseUid, ...publicUser } = user;
    res.json(ok(publicUser));
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = requireDb();
    const id = req.params["id"] as string;

    const [user] = await database
      .select({
        id: usersTable.id,
        name: usersTable.name,
        username: usersTable.username,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        avatarColor: usersTable.avatarColor,
        isOnline: usersTable.isOnline,
        lastSeen: usersTable.lastSeen,
        isVerified: usersTable.isVerified,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!user) {
      next(new NotFoundError("User not found"));
      return;
    }

    res.json(ok(user));
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = requireDb();
    const userId = req.user!.sub;
    const updates = req.body as UpdateUserInput;

    const [updated] = await database
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      next(new NotFoundError("User not found"));
      return;
    }

    const { fcmToken, supabaseUid, ...publicUser } = updated;
    res.json(ok(publicUser));
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = requireDb();
    const userId = req.user!.sub;

    await database
      .update(usersTable)
      .set({ status: "deleted", isOnline: false, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    res.json(ok({ message: "Account scheduled for deletion" }));
  } catch (err) {
    next(err);
  }
}
