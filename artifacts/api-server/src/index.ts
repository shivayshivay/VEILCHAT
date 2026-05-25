import { createServer } from "http";
import app from "./app.js";
import { createSocketServer } from "./sockets/index.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "🛡️  VEILCHAT API server listening");
});

httpServer.on("error", (err) => {
  logger.error({ err }, "HTTP server error");
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  httpServer.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received — shutting down");
  httpServer.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});
