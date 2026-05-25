import type { AuthSocket } from "./connection.js";
import { getSupabaseClient } from "../../database/supabase.js";
import { logger } from "../../lib/logger.js";

export function registerMessageHandlers(socket: AuthSocket): void {
  const { userId, user } = socket.data;
  const senderName = (user as unknown as { name?: string }).name ?? "";

  socket.on("message:send", async (data, ack) => {
    const { conversationId, text, type = "text", replyToId, mediaUrl } = data;

    if (!conversationId || (!text?.trim() && !mediaUrl)) {
      ack({ ok: false, error: "Missing required fields" });
      return;
    }

    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      try {
        // Verify membership
        const { data: member, error: memErr } = await client
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .eq("user_id", userId)
          .single();

        if (memErr || !member) {
          ack({ ok: false, error: "Not a member of this conversation" });
          return;
        }

        // Resolve reply text for context
        let replyToText: string | undefined;
        if (replyToId) {
          const { data: replyMsg } = await client
            .from("messages")
            .select("text, type")
            .eq("id", replyToId)
            .single();
          if (replyMsg) {
            replyToText =
              replyMsg.text ||
              (replyMsg.type !== "text" ? `📎 ${replyMsg.type}` : "");
          }
        }

        // Persist message
        const { data: msg, error: insertErr } = await client
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            sender_name: senderName,
            text: text?.trim() || null,
            type,
            media_url: mediaUrl || null,
            reply_to_id: replyToId || null,
            reply_to_text: replyToText || null,
            status: "sent",
            created_at: now,
          })
          .select(
            "id, conversation_id, sender_id, sender_name, text, type, media_url, reply_to_id, reply_to_text, status, created_at"
          )
          .single();

        if (insertErr) throw insertErr;

        // Update conversation metadata
        await client
          .from("conversations")
          .update({
            last_message_at: now,
            last_message_text: text?.trim() || (mediaUrl ? `📎 ${type}` : ""),
            last_message_sender_id: userId,
            updated_at: now,
          })
          .eq("id", conversationId);

        const outMessage = {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name ?? "",
          text: msg.text || "",
          type: msg.type,
          mediaUrl: msg.media_url ?? undefined,
          replyToId: msg.reply_to_id ?? undefined,
          replyToText: msg.reply_to_text ?? undefined,
          status: "sent" as const,
          timestamp: new Date(msg.created_at).getTime(),
          reactions: [],
        };

        // Broadcast to all other members in the conversation room
        socket.to(`conversation:${conversationId}`).emit("message:new", outMessage);

        // Ack to sender with persisted message (contains server-assigned ID)
        ack({ ok: true, data: outMessage });

        logger.info(
          { msgId: msg.id, conversationId, userId },
          "Message persisted and broadcast"
        );
      } catch (err) {
        logger.error({ err, userId, conversationId }, "Failed to persist message");
        ack({ ok: false, error: "Server error — message not saved" });
      }
    } else {
      // No Supabase — ephemeral broadcast only (demo mode)
      const demoMsg = {
        id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversationId,
        senderId: userId,
        senderName,
        text: text || "",
        type,
        mediaUrl,
        replyToId,
        status: "sent" as const,
        timestamp: Date.now(),
        reactions: [],
      };
      socket.to(`conversation:${conversationId}`).emit("message:new", demoMsg);
      ack({ ok: true, data: demoMsg });
    }
  });
}

/**
 * Join all conversation rooms for this user on socket connect.
 */
export async function joinUserConversationRooms(socket: AuthSocket): Promise<void> {
  const { userId } = socket.data;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { data: memberships, error } = await client
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (error) {
      logger.warn({ userId, error }, "Could not load conversation rooms for socket");
      return;
    }

    for (const m of memberships ?? []) {
      socket.join(`conversation:${(m as Record<string, string>).conversation_id}`);
    }

    logger.debug({ userId, rooms: memberships?.length ?? 0 }, "Joined conversation rooms");
  } catch (err) {
    logger.error({ err, userId }, "Error joining conversation rooms");
  }
}
