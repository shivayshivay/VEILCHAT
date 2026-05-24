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

interface ChatStore {
  conversations: Conversation[];
  contacts: Contact[];
  callRecords: CallRecord[];

  getConversation: (contactId: string) => Conversation | undefined;
  getMessages: (contactId: string) => Message[];
  getMessage: (contactId: string, msgId: string) => Message | undefined;

  sendMessage: (contactId: string, payload: SendMessagePayload) => void;
  addReaction: (contactId: string, msgId: string, emoji: string, userId: string) => void;
  updateMessageStatus: (contactId: string, msgId: string, status: MessageStatus) => void;
  markRead: (contactId: string) => void;
  setTypingIndicator: (contactId: string, typing: boolean) => void;

  searchContacts: (query: string) => Contact[];
  toggleFavorite: (contactId: string) => void;
  initSocketListeners: () => () => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: MOCK_CONTACTS.map((c, i) => seedConversation(c, (i + 1) * 900000)),
  contacts: MOCK_CONTACTS,
  callRecords: MOCK_CONTACTS.slice(0, 5).map((c, i) => ({
    id: `call_${c.id}`,
    contactId: c.id,
    contact: c,
    type: (["outgoing", "incoming", "missed", "outgoing", "incoming"] as const)[i % 5],
    isVideo: i % 3 === 0,
    timestamp: Date.now() - (i + 1) * 3600000,
    duration: i % 3 === 2 ? 0 : 60 + i * 45,
  })),

  getConversation: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId),

  getMessages: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId)?.messages ?? [],

  getMessage: (contactId, msgId) =>
    get().conversations.find((c) => c.contact.id === contactId)?.messages.find((m) => m.id === msgId),

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

    const msgId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const msg: Message = {
      id: msgId,
      conversationId: `conv_${contactId}`,
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

    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.contact.id === contactId
          ? { ...conv, messages: [...conv.messages, msg], lastActivity: Date.now() }
          : conv
      ),
    }));

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { ...msg, senderName: myName });
      return;
    }

    const tick = (status: MessageStatus, delay: number) =>
      setTimeout(() => {
        set((s) => ({
          conversations: s.conversations.map((conv) =>
            conv.contact.id === contactId
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === msgId ? { ...m, status, isOptimistic: false } : m
                  ),
                }
              : conv
          ),
        }));
      }, delay);

    tick("sent", 500);
    tick("delivered", 1100);

    setTimeout(() => get().setTypingIndicator(contactId, true), 1400);

    const replyAt = 2200 + Math.random() * 1000;
    setTimeout(() => {
      const reply: Message = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        conversationId: `conv_${contactId}`,
        senderId: contactId,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        type: "text",
        status: "read",
        timestamp: Date.now(),
        reactions: [],
      };
      set((s) => ({
        conversations: s.conversations.map((conv) =>
          conv.contact.id === contactId
            ? {
                ...conv,
                isTyping: false,
                messages: [
                  ...conv.messages.map((m) =>
                    m.id === msgId ? { ...m, status: "read" as const } : m
                  ),
                  reply,
                ],
                lastActivity: Date.now(),
              }
            : conv
        ),
      }));
    }, replyAt);
  },

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
                const newUserIds = reactions[idx].userIds.filter((id) => id !== userId);
                if (newUserIds.length === 0) {
                  return { ...msg, reactions: reactions.filter((_, i) => i !== idx) };
                }
                return {
                  ...msg,
                  reactions: reactions.map((r, i) => (i === idx ? { ...r, userIds: newUserIds } : r)),
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

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return () => {};

    const onNewMessage = (msg: Message) => {
      const contactId = msg.conversationId.replace("conv_", "");
      set((s) => {
        const conv = s.conversations.find((c) => c.contact.id === contactId);
        if (!conv) return s;
        if (conv.messages.some((m) => m.id === msg.id)) return s;
        return {
          conversations: s.conversations.map((c) =>
            c.contact.id === contactId
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  lastActivity: Date.now(),
                  unreadCount: c.unreadCount + 1,
                }
              : c
          ),
        };
      });
    };

    const onTypingStart = (d: { conversationId: string }) => {
      get().setTypingIndicator(d.conversationId.replace("conv_", ""), true);
    };
    const onTypingStop = (d: { conversationId: string }) => {
      get().setTypingIndicator(d.conversationId.replace("conv_", ""), false);
    };
    const onMessageRead = (d: { conversationId: string; messageId: string }) => {
      get().updateMessageStatus(d.conversationId.replace("conv_", ""), d.messageId, "read");
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
}));
