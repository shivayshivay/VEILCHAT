import { Router } from "express";
import { env } from "../config/env.js";
import { isRedisConfigured, redisHealthCheck } from "../services/redis.service.js";
import { isFirebaseConfigured } from "../services/firebase.service.js";
import { isCloudinaryConfigured } from "../services/cloudinary.service.js";
import { isSupabaseConfigured } from "../database/supabase.js";
import { getConnectedCount } from "../sockets/index.js";

const router = Router();

router.get("/healthz", async (_req, res) => {
  const start = Date.now();

  const dbConfigured = !!env.DATABASE_URL;
  let dbStatus: "ok" | "error" | "unconfigured" = "unconfigured";

  if (dbConfigured) {
    try {
      const { pool } = await import("@workspace/db");
      await pool!.query("SELECT 1");
      dbStatus = "ok";
    } catch {
      dbStatus = "error";
    }
  }

  let redisStatus: "ok" | "error" | "unconfigured" = "unconfigured";
  if (isRedisConfigured()) {
    redisStatus = (await redisHealthCheck()) ? "ok" : "error";
  }

  const degraded = dbStatus === "error" || redisStatus === "error";

  res.status(degraded ? 503 : 200).json({
    ok: !degraded,
    data: {
      status: degraded ? "degraded" : "ok",
      version: "1.0.0",
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - start,
      services: {
        database: { status: dbStatus },
        supabase: {
          status: isSupabaseConfigured() ? "configured" : "unconfigured",
        },
        redis: { status: redisStatus },
        firebase: {
          status: isFirebaseConfigured() ? "configured" : "unconfigured",
        },
        cloudinary: {
          status: isCloudinaryConfigured() ? "configured" : "unconfigured",
        },
        socket: {
          status: "ok",
          connectedClients: getConnectedCount(),
        },
      },
    },
  });
});

export default router;
