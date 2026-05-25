import { z } from "zod";

export const updateUserValidator = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores"
    )
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #00F5D4)")
    .optional(),
  fcmToken: z.string().nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserValidator>;

export const userIdParamValidator = z.object({
  id: z.string().uuid("Invalid user ID"),
});
