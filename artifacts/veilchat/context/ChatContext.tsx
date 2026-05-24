import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: "sent" | "delivered" | "read";
  type: "text" | "voice";
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  isOnline: boolean;
  lastSeen: number;
  isVerified: boolean;
}

export interface Conversation {
  contact: Contact;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  typing: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Alex Mercer", phone: "+1 555 0101", avatarColor: "#7C3AED", isOnline: true, lastSeen: Date.now(), isVerified: true },
  { id: "c2", name: "Sofia Chen", phone: "+1 555 0102", avatarColor: "#F59E0B", isOnline: false, lastSeen: Date.now() - 3600000, isVerified: true },
  { id: "c3", name: "Marcus Webb", phone: "+1 555 0103", avatarColor: "#EF4444", isOnline: true, lastSeen: Date.now(), isVerified: false },
  { id: "c4", name: "Yara Solis", phone: "+1 555 0104", avatarColor: "#3B82F6", isOnline: false, lastSeen: Date.now() - 86400000, isVerified: true },
  { id: "c5", name: "Kai Nakamura", phone: "+1 555 0105", avatarColor: "#10B981", isOnline: true, lastSeen: Date.now(), isVerified: false },
  { id: "c6", name: "Priya Patel", phone: "+1 555 0106", avatarColor: "#EC4899", isOnline: false, lastSeen: Date.now() - 7200000, isVerified: true },
];

const MOCK_LAST_MESSAGES: Record<string, { text: string; time: number; unread: number }> = {
  c1: { text: "Let me know when you're free tonight", time: Date.now() - 120000, unread: 2 },
  c2: { text: "The design looks perfect 🔥", time: Date.now() - 3600000, unread: 0 },
  c3: { text: "Can you send me the files?", time: Date.now() - 7200000, unread: 1 },
  c4: { text: "See you tomorrow!", time: Date.now() - 86400000, unread: 0 },
  c5: { text: "That's exactly what I was thinking", time: Date.now() - 172800000, unread: 0 },
  c6: { text: "Call me when you get a chance", time: Date.now() - 259200000, unread: 3 },
};

interface ChatContextType {
  contacts: Contact[];
  conversations: Conversation[];
  getMessages: (contactId: string) => Message[];
  sendMessage: (contactId: string, text: string, myId: string) => void;
  markRead: (contactId: string) => void;
  searchContacts: (q: string) => Contact[];
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    const init: Record<string, Message[]> = {};
    MOCK_CONTACTS.forEach((c) => {
      const mock = MOCK_LAST_MESSAGES[c.id];
      if (mock) {
        init[c.id] = [
          {
            id: "m0_" + c.id,
            text: mock.text,
            senderId: c.id,
            timestamp: mock.time,
            status: "read",
            type: "text",
          },
        ];
      } else {
        init[c.id] = [];
      }
    });
    setMessages(init);
    const u: Record<string, number> = {};
    MOCK_CONTACTS.forEach((c) => {
      u[c.id] = MOCK_LAST_MESSAGES[c.id]?.unread ?? 0;
    });
    setUnread(u);
  }, []);

  const getMessages = useCallback(
    (contactId: string): Message[] => messages[contactId] ?? [],
    [messages]
  );

  const sendMessage = useCallback(
    (contactId: string, text: string, myId: string) => {
      const msg: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        text,
        senderId: myId,
        timestamp: Date.now(),
        status: "sent",
        type: "text",
      };
      setMessages((prev) => ({
        ...prev,
        [contactId]: [...(prev[contactId] ?? []), msg],
      }));
      setTimeout(() => {
        const reply: Message = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          text: getAutoReply(text),
          senderId: contactId,
          timestamp: Date.now(),
          status: "read",
          type: "text",
        };
        setMessages((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] ?? []), reply],
        }));
      }, 1200 + Math.random() * 1500);
    },
    []
  );

  const markRead = useCallback((contactId: string) => {
    setUnread((prev) => ({ ...prev, [contactId]: 0 }));
  }, []);

  const searchContacts = useCallback(
    (q: string): Contact[] => {
      if (!q.trim()) return MOCK_CONTACTS;
      const lower = q.toLowerCase();
      return MOCK_CONTACTS.filter((c) => c.name.toLowerCase().includes(lower));
    },
    []
  );

  const conversations: Conversation[] = MOCK_CONTACTS.map((c) => {
    const msgs = messages[c.id] ?? [];
    const last = msgs[msgs.length - 1];
    const mock = MOCK_LAST_MESSAGES[c.id];
    return {
      contact: c,
      lastMessage: last?.text ?? mock?.text ?? "",
      lastMessageTime: last?.timestamp ?? mock?.time ?? 0,
      unreadCount: unread[c.id] ?? 0,
      typing: false,
    };
  }).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

  return (
    <ChatContext.Provider value={{ contacts: MOCK_CONTACTS, conversations, getMessages, sendMessage, markRead, searchContacts }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be inside ChatProvider");
  return ctx;
}

function getAutoReply(text: string): string {
  const replies = [
    "Got it, I'll get back to you soon.",
    "Sure thing!",
    "Sounds good to me.",
    "Let me check and I'll let you know.",
    "That's interesting.",
    "I was just thinking the same thing.",
    "No problem at all.",
    "I'll look into it.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
