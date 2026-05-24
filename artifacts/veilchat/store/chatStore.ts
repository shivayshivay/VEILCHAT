import { create } from "zustand";
import { Contact, Conversation, Message, CallRecord } from "@/types/chat";

const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Alex Mercer", phone: "+1 555 0101", avatarColor: "#7C3AED", isOnline: true, lastSeen: Date.now(), isVerified: true, isFavorite: true },
  { id: "c2", name: "Sofia Chen", phone: "+1 555 0102", avatarColor: "#F59E0B", isOnline: false, lastSeen: Date.now() - 3600000, isVerified: true, isFavorite: false },
  { id: "c3", name: "Marcus Webb", phone: "+1 555 0103", avatarColor: "#EF4444", isOnline: true, lastSeen: Date.now(), isVerified: false, isFavorite: false },
  { id: "c4", name: "Yara Solis", phone: "+1 555 0104", avatarColor: "#3B82F6", isOnline: false, lastSeen: Date.now() - 86400000, isVerified: true, isFavorite: true },
  { id: "c5", name: "Kai Nakamura", phone: "+1 555 0105", avatarColor: "#10B981", isOnline: true, lastSeen: Date.now(), isVerified: false, isFavorite: false },
  { id: "c6", name: "Priya Patel", phone: "+1 555 0106", avatarColor: "#EC4899", isOnline: false, lastSeen: Date.now() - 7200000, isVerified: true, isFavorite: false },
];

const SEED_MESSAGES: Record<string, string> = {
  c1: "Let me know when you're free tonight",
  c2: "The design looks absolutely perfect",
  c3: "Can you send me the files?",
  c4: "See you tomorrow!",
  c5: "That's exactly what I was thinking",
  c6: "Call me when you get a chance",
};

function seedConversation(contact: Contact, offset: number): Conversation {
  return {
    id: `conv_${contact.id}`,
    contact,
    messages: [
      {
        id: `msg_seed_${contact.id}`,
        conversationId: `conv_${contact.id}`,
        senderId: contact.id,
        text: SEED_MESSAGES[contact.id] ?? "Hey!",
        type: "text",
        status: "read",
        timestamp: Date.now() - offset,
      },
    ],
    unreadCount: offset < 1800000 ? 1 : 0,
    isTyping: false,
    lastActivity: Date.now() - offset,
  };
}

const AUTO_REPLIES = [
  "Got it, I'll get back to you soon.",
  "Sure thing!",
  "Sounds good to me.",
  "Let me check and I'll let you know.",
  "That's interesting.",
  "I was just thinking the same thing.",
  "No problem at all.",
];

interface ChatStore {
  conversations: Conversation[];
  contacts: Contact[];
  callRecords: CallRecord[];
  typingMap: Record<string, boolean>;

  getConversation: (contactId: string) => Conversation | undefined;
  getMessages: (contactId: string) => Message[];
  sendMessage: (contactId: string, text: string, myId: string) => void;
  markRead: (contactId: string) => void;
  setTyping: (contactId: string, typing: boolean) => void;
  searchContacts: (query: string) => Contact[];
  toggleFavorite: (contactId: string) => void;
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
  typingMap: {},

  getConversation: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId),

  getMessages: (contactId) =>
    get().conversations.find((c) => c.contact.id === contactId)?.messages ?? [],

  sendMessage: (contactId, text, myId) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      conversationId: `conv_${contactId}`,
      senderId: myId,
      text,
      type: "text",
      status: "sent",
      timestamp: Date.now(),
    };
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.contact.id === contactId
          ? { ...conv, messages: [...conv.messages, msg], lastActivity: Date.now() }
          : conv
      ),
    }));

    setTimeout(() => {
      const reply: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        conversationId: `conv_${contactId}`,
        senderId: contactId,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        type: "text",
        status: "read",
        timestamp: Date.now(),
      };
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.contact.id === contactId
            ? { ...conv, messages: [...conv.messages, reply], lastActivity: Date.now(), isTyping: false }
            : conv
        ),
      }));
    }, 1200 + Math.random() * 1000);
  },

  markRead: (contactId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.contact.id === contactId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),

  setTyping: (contactId, typing) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.contact.id === contactId ? { ...conv, isTyping: typing } : conv
      ),
    })),

  searchContacts: (query) => {
    if (!query.trim()) return get().contacts;
    const lower = query.toLowerCase();
    return get().contacts.filter((c) => c.name.toLowerCase().includes(lower) || c.phone.includes(lower));
  },

  toggleFavorite: (contactId) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    })),
}));
