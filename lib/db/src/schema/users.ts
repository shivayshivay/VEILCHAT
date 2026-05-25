import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "banned",
  "deleted",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  avatarColor: varchar("avatar_color", { length: 7 }).notNull().default("#00F5D4"),
  status: userStatusEnum("status").notNull().default("active"),
  isVerified: boolean("is_verified").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  fcmToken: text("fcm_token"),
  supabaseUid: varchar("supabase_uid", { length: 255 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = z.object({
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  name: z.string().min(1).max(100),
  username: z.string().max(50).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  status: z.enum(["active", "inactive", "banned", "deleted"]).optional(),
  isVerified: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  lastSeen: z.date().nullable().optional(),
  fcmToken: z.string().nullable().optional(),
  supabaseUid: z.string().max(255).nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(50).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fcmToken: z.string().nullable().optional(),
  isOnline: z.boolean().optional(),
  lastSeen: z.date().nullable().optional(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PublicUser = Omit<User, "fcmToken" | "supabaseUid">;
