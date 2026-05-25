export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  conversation: (convId: string) => `conversation:${convId}`,
} as const;

export const SOCKET_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_SEND: "message:send",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  CALL_INVITE: "call:invite",
  CALL_ANSWER: "call:answer",
  CALL_END: "call:end",
  ERROR: "error",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
