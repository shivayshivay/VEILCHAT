import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { defaultRateLimit } from "./middleware/rateLimit.middleware.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          userAgent: req.headers?.["user-agent"],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

const allowedOrigins =
  env.ALLOWED_ORIGINS === "*"
    ? "*"
    : env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api", defaultRateLimit);
app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

export default app;
