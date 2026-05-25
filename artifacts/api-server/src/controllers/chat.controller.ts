import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "../database/supabase.js";
import { ok } from "../utils/response.js";
import { ForbiddenError } from "../utils/errors.js";

// ─── Conversations ────────────────────────────────────────────────────────────

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const client = getSupabaseClient();
    if (!client) {
      res.status(200).json(ok({ conversations: [] }));
      return;
    }

    const { data: memberships, error: memErr } = await client
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memErr) throw memErr;

    const convIds = (memberships ?? []).map((m: Record<string, string>) => m.conversation_id);
    if (convIds.length === 0) {
      res.status(200).json(ok({ conversations: [] }));
      return;
    }

    const { data: conversations, error: convErr } = await client
      .from("conversations")
      .select(`
        id,
        created_at,
        updated_at,
        last_message_at,
        last_message_text,
        last_message_sender_id,
        conversation_members ( user_id, display_name, avatar_color, avatar_url, last_read_at )
      `)
      .in("id", convIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convErr) throw convErr;

    res.status(200).json(ok({ conversations: conversations ?? [] }));
  } catch (err) {
    next(err);
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.sub;
    const limit = Math.min(Number(req.query["limit"] ?? 50), 100);
    const before = req.query["before"] as string | undefined;

    const client = getSupabaseClient();
    if (!client) {
      res.status(200).json(ok({ messages: [], hasMore: false }));
      return;
    }

    const { data: member } = await client
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!member) {
      throw new ForbiddenError("Not a member of this conversation");
    }

    let query = client
      .from("messages")
      .select(
        "id, conversation_id, sender_id, sender_name, text, type, media_url, reply_to_id, reply_to_text, status, created_at"
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (before) query = query.lt("created_at", before);

    const { data: rows, error } = await query;
    if (error) throw error;

    const messages = (rows ?? []).slice(0, limit).reverse();
    const hasMore = (rows ?? []).length > limit;

    res.status(200).json(ok({ messages, hasMore }));
  } catch (err) {
    next(err);
  }
}

// ─── Find or create conversation ─────────────────────────────────────────────

export async function findOrCreateConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const myId = req.user!.sub;
    const myName: string = req.user!.name ?? "";
    const {
      otherUserId,
      otherUserName,
      otherAvatarColor,
    } = req.body as {
      otherUserId: string;
      otherUserName?: string;
      otherAvatarColor?: string;
    };

    const client = getSupabaseClient();
    if (!client) {
      res.status(200).json(
        ok({ conversation: { id: `local_${myId}_${otherUserId}`, isNew: false } })
      );
      return;
    }

    // Find existing 1:1 conversation
    const { data: myConvs } = await client
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", myId);

    const { data: theirConvs } = await client
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherUserId);

    const mySet = new Set(
      (myConvs ?? []).map((m: Record<string, string>) => m.conversation_id)
    );
    const existing = (theirConvs ?? []).find((m: Record<string, string>) =>
      mySet.has(m.conversation_id)
    );

    if (existing) {
      res.status(200).json(
        ok({ conversation: { id: existing.conversation_id, isNew: false } })
      );
      return;
    }

    // Create new conversation
    const { data: conv, error: convErr } = await client
      .from("conversations")
      .insert({ last_message_at: new Date().toISOString() })
      .select("id")
      .single();

    if (convErr) throw convErr;

    await client.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: myId, display_name: myName },
      {
        conversation_id: conv.id,
        user_id: otherUserId,
        display_name: otherUserName ?? null,
        avatar_color: otherAvatarColor ?? "#00F5D4",
      },
    ]);

    res.status(201).json(ok({ conversation: { id: conv.id, isNew: true } }));
  } catch (err) {
    next(err);
  }
}

// ─── Mark read ────────────────────────────────────────────────────────────────

export async function markConversationRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.sub;
    const client = getSupabaseClient();

    if (client) {
      await Promise.all([
        client
          .from("conversation_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId),
        client
          .from("messages")
          .update({ status: "read" })
          .eq("conversation_id", conversationId)
          .neq("sender_id", userId)
          .in("status", ["sent", "delivered"]),
      ]);
    }

    res.status(200).json(ok({ ok: true }));
  } catch (err) {
    next(err);
  }
}

// ─── Search users ─────────────────────────────────────────────────────────────

export async function searchUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = ((req.query["q"] as string) ?? "").trim();
    const myId = req.user!.sub;
    const client = getSupabaseClient();

    if (!client || !q) {
      res.status(200).json(ok({ users: [] }));
      return;
    }

    const { data: users, error } = await client
      .from("users")
      .select(
        "id, name, phone, email, avatar_color, avatar_url, is_online, last_seen, is_verified"
      )
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .neq("id", myId)
      .eq("status", "active")
      .limit(20);

    if (error) throw error;

    res.status(200).json(ok({ users: users ?? [] }));
  } catch (err) {
    next(err);
  }
}
