import type { JWTPayload } from "./auth";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: "text" | "image" | "video" | "file" | "voice";
  replyToId?: string;
  mediaUrl?: string;
  timestamp: number;
}

export interface TypingPayload {
  conversationId: string;
  senderId: string;
}

export interface MessageStatusPayload {
  conversationId: string;
  messageId: string;
  status: "delivered" | "read";
}

export interface UserPresencePayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: number;
}

export interface AckResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  type: "text" | "image" | "video" | "file" | "voice";
  replyToId?: string;
  mediaUrl?: string;
}

export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "typing:start": (data: TypingPayload) => void;
  "typing:stop": (data: TypingPayload) => void;
  "user:online": (data: UserPresencePayload) => void;
  "user:offline": (data: UserPresencePayload) => void;
  "message:delivered": (data: MessageStatusPayload) => void;
  "message:read": (data: MessageStatusPayload) => void;
  error: (error: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  "message:send": (
    data: SendMessagePayload,
    ack: (res: AckResponse) => void
  ) => void;
  "typing:start": (data: TypingPayload) => void;
  "typing:stop": (data: TypingPayload) => void;
  "message:read": (data: MessageStatusPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  user: JWTPayload;
}
