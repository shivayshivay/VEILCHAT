export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
export type MessageType = "text" | "voice" | "image" | "video" | "file";
export type CallType = "incoming" | "outgoing" | "missed";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: number;
  replyToId?: string;
  mediaUrl?: string;
  duration?: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: number;
  isVerified: boolean;
  isFavorite: boolean;
  supabaseId?: string;
}

export interface Conversation {
  id: string;
  contact: Contact;
  messages: Message[];
  unreadCount: number;
  isTyping: boolean;
  lastActivity: number;
}

export interface CallRecord {
  id: string;
  contactId: string;
  contact: Contact;
  type: CallType;
  isVideo: boolean;
  timestamp: number;
  duration: number;
}
