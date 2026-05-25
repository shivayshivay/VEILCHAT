import { z } from "zod";

const isDev = process.env.NODE_ENV !== "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  DATABASE_URL: z.string().optional(),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  JWT_ACCESS_SECRET: isDev
    ? z.string().default("dev-access-secret-change-in-production-32chars!!")
    : z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: isDev
    ? z.string().default("dev-refresh-secret-change-in-production-32chars!!")
    : z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  ALLOWED_ORIGINS: z.string().default("*"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    result.error.errors.forEach((e) => {
      console.error(`  ${e.path.join(".")}: ${e.message}`);
    });
    process.exit(1);
  }

  const data = result.data;
  if (isDev) {
    if (data.JWT_ACCESS_SECRET.startsWith("dev-")) {
      console.warn("⚠️  Using development JWT secrets — never use these in production");
    }
    const unconfigured = [
      !data.DATABASE_URL && "DATABASE_URL",
      !data.SUPABASE_URL && "SUPABASE_URL",
      !data.UPSTASH_REDIS_REST_URL && "UPSTASH_REDIS_REST_URL",
      !data.FIREBASE_PROJECT_ID && "FIREBASE_PROJECT_ID",
      !data.CLOUDINARY_CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
    ].filter(Boolean);

    if (unconfigured.length > 0) {
      console.warn(`ℹ️  Optional services not configured: ${unconfigured.join(", ")}`);
    }
  }

  return data;
}

export const env = parseEnv();
