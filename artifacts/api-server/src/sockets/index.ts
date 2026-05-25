import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.js";
import { authenticateSocket, registerConnectionHandlers } from "./handlers/connection.js";

export type TypedSocketServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let _io: TypedSocketServer | null = null;

export function createSocketServer(httpServer: HttpServer): TypedSocketServer {
  const origins =
    env.ALLOWED_ORIGINS === "*"
      ? "*"
      : env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());

  _io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 5e6,
  });

  _io.use(authenticateSocket);

  _io.on("connection", (socket) => {
    const { userId } = socket.data;
    logger.info({ socketId: socket.id, userId }, "Socket connected");

    socket.join(`user:${userId}`);

    registerConnectionHandlers(socket);
  });

  logger.info("Socket.IO server initialized");
  return _io;
}

export function getIO(): TypedSocketServer {
  if (!_io) throw new Error("Socket.IO server has not been initialized");
  return _io;
}

export function getConnectedCount(): number {
  return _io?.engine.clientsCount ?? 0;
}

export function emitToUser(
  userId: string,
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  (_io as any)?.to(`user:${userId}`).emit(event, ...args);
}

export function emitToConversation(
  conversationId: string,
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  (_io as any)?.to(`conversation:${conversationId}`).emit(event, ...args);
}
