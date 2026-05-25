import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JWTPayload } from "../../types/auth.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../../types/socket.js";
import { logger } from "../../lib/logger.js";
import { registerMessageHandlers, joinUserConversationRooms } from "./messages.js";
import { getSupabaseClient } from "../../database/supabase.js";

export type AuthSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function authenticateSocket(
  socket: AuthSocket,
  next: (err?: Error) => void
): void {
  const token =
    (socket.handshake.auth["token"] as string | undefined) ??
    (socket.handshake.headers["authorization"] as string | undefined)?.replace(
      "Bearer ",
      ""
    );

  if (!token) {
    return next(new Error("AUTH_REQUIRED: Authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    if (payload.type !== "access") {
      return next(new Error("AUTH_INVALID: Token type must be 'access'"));
    }
    socket.data.userId = payload.sub;
    socket.data.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new Error("AUTH_EXPIRED: Access token has expired"));
    }
    logger.warn({ socketId: socket.id }, "Socket authentication failed");
    return next(new Error("AUTH_INVALID: Invalid authentication token"));
  }
}

export function registerConnectionHandlers(socket: AuthSocket): void {
  const { userId } = socket.data;
  const client = getSupabaseClient();

  // Join user's conversation rooms
  joinUserConversationRooms(socket);

  // Update online presence
  if (client) {
    void client
      .from("users")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", userId);
  }

  // Register message send/ack handlers
  registerMessageHandlers(socket);

  socket.on("disconnect", (reason) => {
    logger.info({ socketId: socket.id, userId, reason }, "Socket disconnected");

    // Update offline presence
    if (client) {
      void client
        .from("users")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", userId);
    }
  });

  socket.on("error", (err) => {
    logger.error({ socketId: socket.id, userId, err }, "Socket error");
  });

  socket.on("typing:start", (data) => {
    socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
      conversationId: data.conversationId,
      senderId: userId,
    });
  });

  socket.on("typing:stop", (data) => {
    socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
      conversationId: data.conversationId,
      senderId: userId,
    });
  });

  socket.on("message:read", async (data) => {
    // Broadcast read receipt to conversation
    socket.to(`conversation:${data.conversationId}`).emit("message:read", {
      conversationId: data.conversationId,
      messageId: data.messageId,
      status: "read",
    });

    // Persist read status to Supabase
    if (client) {
      try {
        await client
          .from("messages")
          .update({ status: "read" })
          .eq("id", data.messageId)
          .neq("sender_id", userId);
      } catch {
        // Non-critical — swallow error
      }
    }
  });
}
