import { create } from "zustand";
import {
  Contact,
  Conversation,
  Message,
  MessageReaction,
  CallRecord,
  MessageStatus,
  MessageType,
  SendMessagePayload,
} from "@/types/chat";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import { supabase } from "@/src/config/supabase";
import { env } from "@/src/config/env";

// ─── Demo seed data ──────────────────────────────────────────────────────────

const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Alex Mercer", phone: "+1 555 0101", avatarColor: "#7C3AED", isOnline: true, lastSeen: Date.now(), isVerified: true, isFavorite: true },
  { id: "c2", name: "Sofia Chen", phone: "+1 555 0102", avatarColor: "#F59E0B", isOnline: false, lastSeen: Date.now() - 3600000, isVerified: true, isFavorite: false },
  { id: "c3", name: "Marcus Webb", phone: "+1 555 0103", avatarColor: "#EF4444", isOnline: true, lastSeen: Date.now(), isVerified: false, isFavorite: false },
  { id: "c4", name: "Yara Solis", phone: "+1 555 0104", avatarColor: "#3B82F6", isOnline: false, lastSeen: Date.now() - 86400000, isVerified: true, isFavorite: true },
  { id: "c5", name: "Kai Nakamura", phone: "+1 555 0105", avatarColor: "#10B981", isOnline: true, lastSeen: Date.now(), isVerified: false, isFavorite: false },
  { id: "c6", name: "Priya Patel", phone: "+1 555 0106", avatarColor: "#EC4899", isOnline: false, lastSeen: Date.now() - 7200000, isVerified: true, isFavorite: false },
];

const SEED_OPENERS: Record<string, string> = {
  c1: "Hey, are you free tonight?",
  c2: "Just finished the design mockups 🎨",
  c3: "Can you send me those files?",
  c4: "Looking forward to tomorrow!",
  c5: "That idea you had is brilliant",
  c6: "Call me when you get a chance",
};

const SEED_REPLIES: Record<string, string> = {
  c1: "Let me know when you're free tonight",
  c2: "The design looks absolutely perfect ✨",
  c3: "I'll send them over right now",
  c4: "See you tomorrow! 🙌",
  c5: "That's exactly what I was thinking",
  c6: "Sure, will call you in 10",
};

const AUTO_REPLIES = [
  "Got it! I'll get back to you soon.",
  "Sure thing! 👍",
  "Sounds good to me.",
  "Let me check and I'll let you know.",
  "That's interesting 🤔",
  "I was just thinking the same thing.",
  "No problem at all!",
  "On it! 🚀",
  "Makes sense, thanks for the heads up.",
  "Absolutely, let's do it.",
];

const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function seedConversation(contact: Contact, offset: number): Conversation {
  const convId = `conv_${contact.id}`;
  const now = Date.now();
  const messages: Message[] = [
    {
      id: `seed_${contact.id}_1`,
      conversationId: convId,
      senderId: contact.id,
      text: SEED_OPENERS[contact.id] ?? "Hey there!",
      type: "text",
      status: "read",
      timestamp: now - offset - 7200000,
      reactions: [],
    },
    {
      id: `seed_${contact.id}_2`,
      conversationId: convId,
      senderId: "me",
      text: "Hey! How are you doing?",
      type: "text",
      status: "read",
      timestamp: now - offset - 3600000,
      reactions: contact.isFavorite ? [{ emoji: "❤️", userIds: [contact.id] }] : [],
    },
    {
      id: `seed_${contact.id}_3`,
      conversationId: convId,
      senderId: contact.id,
      text: SEED_REPLIES[contact.id] ?? "I'm good, thanks!",
      type: "text",
      status: "read",
      timestamp: now - offset,
      reactions: [],
    },
  ];
  return {
    id: convId,
    contact,
    messages,
    unreadCount: offset < 1800000 ? 1 : 0,
    isTyping: false,
    lastActivity: now - offset,
  };
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function apiBase(): string {
  const domain = env.api.baseUrl;
  return domain ? `${domain}/chat` : "";
}

async function apiFetch<T>(
  path: string,
  token: string,
  opts?: RequestInit
): Promise<T | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function mapApiConversation(
  apiConv: Record<string, unknown>,
  myUserId: string
): Conversation | null {
  const members = (apiConv["conversation_members"] as Array<Record<string, string>>) ?? [];
  const other = members.find((m) => m["user_id"] !== myUserId);
  if (!other) return null;

  const contact: Contact = {
    id: other["user_id"],
    name: other["display_name"] ?? "Unknown",
    phone: other["phone"] ?? "",
    avatarColor: other["avatar_color"] ?? "#00F5D4",
    avatarUrl: other["avatar_url"] ?? undefined,
    isOnline: false,
    lastSeen: Date.now(),
    isVerified: false,
    isFavorite: false,
  };

  const lastMsgAt = apiConv["last_message_at"] as string | null;
  return {
    id: apiConv["id"] as string,
    contact,
    messages: [],
    unreadCount: 0,
    isTyping: false,
    lastActivity: lastMsgAt ? new Date(lastMsgAt).getTime() : Date.now(),
  };
}

function mapApiMessage(row: Record<string, unknown>): Message {
  return {
    id: row["id"] as string,
    conversationId: row["conversation_id"] as string,
    senderId: row["sender_id"] as string,
    text: (row["text"] as string) || "",
    type: ((row["type"] as string) ?? "text") as MessageType,
    status: ((row["status"] as string) ?? "sent") as MessageStatus,
    timestamp: new Date(row["created_at"] as string).getTime(),
    replyToId: (row["reply_to_id"] as string) ?? undefined,
    replyToText: (row["reply_to_text"] as string) ?? undefined,
    mediaUrl: (row["media_url"] as string) ?? undefined,
    reactions: [],
    isOptimistic: false,
  };
}

// ─── Supabase realtime subscription ──────────────────────────────────────────

let _realtimeUnsubscribe: (() => void) | null = null;

function setupRealtimeSubscription(
  convIds: string[],
  myUserId: string
): void {
  if (!supabase || convIds.length === 0) return;

  // Tear down previous subscription
  if (_realtimeUnsubscribe) {
    _realtimeUnsubscribe();
    _realtimeUnsubscribe = null;
  }

  const convIdSet = new Set(convIds);

  const channel = supabase
    .channel("veilchat-messages-store")
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "messages" },
      (payload: { new: Record<string, unknown> }) => {
        const row = payload.new;
        const convId = row["conversation_id"] as string;
        if (!convIdSet.has(convId)) return;
        if (row["sender_id"] === myUserId) return;
        useChatStore.getState()._handleRealtimeMessage(row);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info("[chat] Supabase realtime subscribed");
      }
    });

  _realtimeUnsubscribe = () => {
    supabase?.removeChannel(channel).catch(() => {});
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface ChatStore {
  conversations: Conversation[];
  contacts: Contact[];
  callRecords: CallRecord[];
  isLoading: boolean;
  isInitialized: boolean;

  // Lifecycle
  initialize: (userId: string, accessToken: string) => Promise<void>;
  openConversation: (contactId: string, accessToken: string, myId: string, myName: string) => Promise<string>;
  reset: () => void;

  // Read
  getConversation: (contactId: string) => Conversation | undefined;
  getConversationById: (convId: string) => Conversation | undefined;
  getMessages: (contactId: string) => Message[];
  getMessage: (contactId: string, msgId: string) => Message | undefined;

  // Write
  sendMessage: (contactId: string, payload: SendMessagePayload) => void;
  addReaction: (contactId: string, msgId: string, emoji: string, userId: string) => void;
  updateMessageStatus: (contactId: string, msgId: string, status: MessageStatus) => void;
  markRead: (contactId: string) => void;
  setTypingIndicator: (contactId: string, typing: boolean) => void;

  // Socket
  initSocketListeners: () => () => void;

  // Internal
  _handleRealtimeMessage: (row: Record<string, unknown>) => void;

  // Contacts
  searchContacts: (query: string) => Contact[];
  toggleFavorite: (contactId: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const DEMO_CONVERSATIONS = MOCK_CONTACTS.map((c, i) =>
  seedConversation(c, (i + 1) * 900000)
);
const DEMO_CALL_RECORDS: CallRecord[] = MOCK_CONTACTS.slice(0, 5).map((c, i) => ({
  id: `call_${c.id}`,
  contactId: c.id,
  contact: c,
  type: (["outgoing", "incoming", "missed", "outgoing", "incoming"] as const)[i % 5],
  isVideo: i % 3 === 0,
  timestamp: Date.now() - (i + 1) * 3600000,
  duration: i % 3 === 2 ? 0 : 60 + i * 45,
}));

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: DEMO_CONVERSATIONS,
  contacts: MOCK_CONTACTS,
  callRecords: DEMO_CALL_RECORDS,
  isLoading: false,
  isInitialized: false,

  // ── Lifecycle ────────────────────────────────────────────────────────────

  initialize: async (userId, accessToken) => {
    set({ isLoading: true });
    try {
      const data = await apiFetch<{ conversations: Record<string, unknown>[] }>(
        "/conversations",
        accessToken
      );

      if (!data) {
        // API unavailable — keep demo data
        set({ isLoading: false });
        return;
      }

      const conversations: Conversation[] = [];
      for (const apiConv of data.conversations ?? []) {
        const conv = mapApiConversation(apiConv, userId);
        if (conv) conversations.push(conv);
      }

      // Extract contacts from conversations
      const contacts: Contact[] = conversations.map((c) => c.contact);

      set({ conversations, contacts, isInitialized: true, isLoading: false });

      // Set up Supabase realtime for incoming messages
      setupRealtimeSubscription(
        conversations.map((c) => c.id),
        userId
      );
    } catch {
      set({ isLoading: false });
    }
  },

  openConversation: async (contactId, accessToken, myId, myName) => {
    const existing = get().conversations.find((c) => c.contact.id === contactId);

    // Already have a real conversation
    if (existing && !existing.id.startsWith("conv_")) {
      // Load messages if empty
      if (existing.messages.length === 0) {
        const data = await apiFetch<{ messages: Record<string, unknown>[]; hasMore: boolean }>(
          `/conversations/${existing.id}/messages?limit=50`,
          accessToken
        );
        if (data?.messages) {
          const msgs = data.messages.map(mapApiMessage);
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === existing.id ? { ...c, messages: msgs } : c
            ),
          }));
        }
      }
      return existing.id;
    }

    // Find the contact info
    const contact = get().contacts.find((c) => c.id === contactId);
    if (!contact) return `conv_${contactId}`;

    // Create or find conversation via API
    const data = await apiFetch<{ conversation: { id: string; isNew: boolean } }>(
      "/conversations",
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          otherUserId: contactId,
          otherUserName: contact.name,
          otherAvatarColor: contact.avatarColor,
        }),
      }
    );

    if (!data) return existing?.id ?? `conv_${contactId}`;

    const convId = data.conversation.id;

    // Replace or add conversation in store
    set((s) => {
      const alreadyExists = s.conversations.some((c) => c.id === convId);
      if (alreadyExists) return s;

      const conv: Conversation = {
        id: convId,
        contact,
        messages: [],
        unreadCount: 0,
        isTyping: false,
        lastActivity: Date.now(),
      };
      return { conversations: [conv, ...s.conversations] };
    });

    // Load message history
    const msgs = await apiFetch<{ messages: Record<string, unknown>[]; hasMore: boolean }>(
      `/conversations/${convId}/messages?limit=50`,
      accessToken
    );
    if (msgs?.messages) {
      const mapped = msgs.messages.map(mapApiMessage);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? { ...c, messages: mapped } : c
        ),
      }));
    }

    // Add new convId to realtime subscription
    if (supabase) {
      const allConvIds = get().conversations.map((c) => c.id).filter((id) => !id.startsWith("conv_"));
      const userId = myId;
      setupRealtimeSubscription(allConvIds, userId);
    }

    return convId;
  },

  reset: () => {
    if (_realtimeUnsubscribe) {
      _realtimeUnsubscribe();
      _realtimeUnsubscribe = null;
    }
    set({
      conversations: DEMO_CONVERSATIONS,
      contacts: MOCK_CONTACTS,
      callRecords: DEMO_CALL_RECORDS,
      isInitialized: false,
    });
  },

  // ── Read ─────────────────────────────────────────────────────────────────

  getConversation: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId),

  getConversationById: (convId) =>
    get().conversations.find((c) => c.id === convId),

  getMessages: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId)?.messages ?? [],

  getMessage: (contactId, msgId) =>
    get()
      .conversations.find((c) => c.contact.id === contactId)
      ?.messages.find((m) => m.id === msgId),

  // ── Send message (optimistic + socket ack OR demo fallback) ───────────────

  sendMessage: (contactId, { text, myId, myName, replyToId, mediaUrl, type: mediaType }) => {
    const state = get();
    const conv = state.conversations.find((c) => c.contact.id === contactId);
    if (!conv) return;

    let replyToText: string | undefined;
    let replyToSenderId: string | undefined;
    if (replyToId) {
      const replyMsg = conv.messages.find((m) => m.id === replyToId);
      if (replyMsg) {
        replyToText = replyMsg.text || (replyMsg.mediaUrl ? "📷 Photo" : "");
        replyToSenderId = replyMsg.senderId;
      }
    }

    const tempId = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const msg: Message = {
      id: tempId,
      conversationId: conv.id,
      senderId: myId,
      text: text || "",
      type: mediaUrl ? (mediaType ?? "image") : "text",
      status: "pending",
      timestamp: Date.now(),
      replyToId,
      replyToText,
      replyToSenderId,
      mediaUrl,
      isOptimistic: true,
      reactions: [],
    };

    // Optimistic add
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.contact.id === contactId
          ? { ...c, messages: [...c.messages, msg], lastActivity: msg.timestamp }
          : c
      ),
    }));

    const socket = getSocket();
    if (socket?.connected && !conv.id.startsWith("conv_")) {
      // Real socket path: emit with ack, replace optimistic on success
      socket.emit(
        SOCKET_EVENTS.SEND_MESSAGE,
        {
          conversationId: conv.id,
          text: text?.trim() || null,
          type: msg.type,
          replyToId: replyToId ?? null,
          mediaUrl: mediaUrl ?? null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ack: any) => {
          if (ack?.ok && ack.data) {
            const server = ack.data as Record<string, unknown>;
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.contact.id === contactId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempId
                          ? {
                              ...m,
                              id: server["id"] as string,
                              status: "sent" as MessageStatus,
                              timestamp: (server["timestamp"] as number) ?? m.timestamp,
                              isOptimistic: false,
                            }
                          : m
                      ),
                    }
                  : c
              ),
            }));
          } else {
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.contact.id === contactId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempId ? { ...m, status: "failed" as MessageStatus } : m
                      ),
                    }
                  : c
              ),
            }));
          }
        }
      );
      return;
    }

    // ── Demo fallback: simulate delivery + auto-reply ──────────────────────
    const tick = (status: MessageStatus, delay: number) =>
      setTimeout(() => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.contact.id === contactId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId ? { ...m, status, isOptimistic: false } : m
                  ),
                }
              : c
          ),
        }));
      }, delay);

    tick("sent", 500);
    tick("delivered", 1100);

    setTimeout(() => get().setTypingIndicator(contactId, true), 1400);

    const replyAt = 2200 + Math.random() * 1000;
    setTimeout(() => {
      const reply: Message = {
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        conversationId: conv.id,
        senderId: contactId,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        type: "text",
        status: "read",
        timestamp: Date.now(),
        reactions: [],
      };
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.contact.id === contactId
            ? {
                ...c,
                isTyping: false,
                messages: [
                  ...c.messages.map((m) =>
                    m.id === tempId ? { ...m, status: "read" as const } : m
                  ),
                  reply,
                ],
                lastActivity: Date.now(),
              }
            : c
        ),
      }));
    }, replyAt);
  },

  // ── Reactions ────────────────────────────────────────────────────────────

  addReaction: (contactId, msgId, emoji, userId) => {
    set((s) => ({
      conversations: s.conversations.map((conv) => {
        if (conv.contact.id !== contactId) return conv;
        return {
          ...conv,
          messages: conv.messages.map((msg) => {
            if (msg.id !== msgId) return msg;
            const reactions: MessageReaction[] = [...(msg.reactions ?? [])];
            const idx = reactions.findIndex((r) => r.emoji === emoji);
            if (idx >= 0) {
              const already = reactions[idx].userIds.includes(userId);
              if (already) {
                const newIds = reactions[idx].userIds.filter((id) => id !== userId);
                if (newIds.length === 0) {
                  return { ...msg, reactions: reactions.filter((_, i) => i !== idx) };
                }
                return {
                  ...msg,
                  reactions: reactions.map((r, i) =>
                    i === idx ? { ...r, userIds: newIds } : r
                  ),
                };
              }
              return {
                ...msg,
                reactions: reactions.map((r, i) =>
                  i === idx ? { ...r, userIds: [...r.userIds, userId] } : r
                ),
              };
            }
            return { ...msg, reactions: [...reactions, { emoji, userIds: [userId] }] };
          }),
        };
      }),
    }));
  },

  updateMessageStatus: (contactId, msgId, status) => {
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.contact.id === contactId
          ? {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === msgId ? { ...m, status } : m
              ),
            }
          : conv
      ),
    }));
  },

  markRead: (contactId) =>
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.contact.id === contactId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),

  setTypingIndicator: (contactId, typing) => {
    if (typingTimers[contactId]) {
      clearTimeout(typingTimers[contactId]);
      delete typingTimers[contactId];
    }
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.contact.id === contactId ? { ...conv, isTyping: typing } : conv
      ),
    }));
    if (typing) {
      typingTimers[contactId] = setTimeout(() => {
        get().setTypingIndicator(contactId, false);
      }, 4000);
    }
  },

  // ── Realtime handler (called by Supabase subscription) ───────────────────

  _handleRealtimeMessage: (row) => {
    const convId = row["conversation_id"] as string;
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;

    const msg = mapApiMessage(row);
    // Deduplicate
    if (conv.messages.some((m) => m.id === msg.id)) return;

    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, msg],
              lastActivity: msg.timestamp,
              unreadCount: c.unreadCount + 1,
            }
          : c
      ),
    }));
  },

  // ── Socket event listeners ────────────────────────────────────────────────

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return () => {};

    const onNewMessage = (msg: Message) => {
      // Find conversation by id first, then fallback to old conv_${id} pattern
      const conv =
        get().conversations.find((c) => c.id === msg.conversationId) ??
        get().conversations.find((c) => c.contact.id === msg.conversationId.replace("conv_", ""));

      if (!conv) return;
      if (conv.messages.some((m) => m.id === msg.id)) return;

      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conv.id
            ? {
                ...c,
                messages: [...c.messages, msg],
                lastActivity: msg.timestamp ?? Date.now(),
                unreadCount: c.unreadCount + 1,
              }
            : c
        ),
      }));
    };

    const onTypingStart = (d: { conversationId: string }) => {
      const conv = get().conversations.find(
        (c) => c.id === d.conversationId || c.contact.id === d.conversationId.replace("conv_", "")
      );
      if (conv) get().setTypingIndicator(conv.contact.id, true);
    };

    const onTypingStop = (d: { conversationId: string }) => {
      const conv = get().conversations.find(
        (c) => c.id === d.conversationId || c.contact.id === d.conversationId.replace("conv_", "")
      );
      if (conv) get().setTypingIndicator(conv.contact.id, false);
    };

    const onMessageRead = (d: { conversationId: string; messageId: string }) => {
      const conv = get().conversations.find(
        (c) => c.id === d.conversationId || c.contact.id === d.conversationId.replace("conv_", "")
      );
      if (conv) get().updateMessageStatus(conv.contact.id, d.messageId, "read");
    };

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
    };
  },

  // ── Contacts ─────────────────────────────────────────────────────────────

  searchContacts: (query) => {
    if (!query.trim()) return get().contacts;
    const lower = query.toLowerCase();
    return get().contacts.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.phone.includes(lower)
    );
  },

  toggleFavorite: (contactId) =>
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    })),
}));
