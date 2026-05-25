import { z } from "zod";

export const firebaseAuthValidator = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  deviceId: z.string().min(1).max(128).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  fcmToken: z.string().min(1).max(512).nullable().optional(),
});

export type FirebaseAuthInput = z.infer<typeof firebaseAuthValidator>;

export const refreshTokenValidator = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenValidator>;

export const setupProfileValidator = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters")
    .trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be under 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores"
    )
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be under 500 characters")
    .nullable()
    .optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #00F5D4)")
    .optional(),
});

export type SetupProfileInput = z.infer<typeof setupProfileValidator>;

export const registerDeviceValidator = z.object({
  deviceId: z.string().min(1, "Device ID is required").max(128),
  platform: z.enum(["ios", "android", "web"], {
    errorMap: () => ({ message: "Platform must be ios, android, or web" }),
  }),
  fcmToken: z.string().min(1).max(512).nullable().optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceValidator>;
