import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "";

export const isSocketConfigured = SOCKET_URL.length > 0;

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (!isSocketConfigured) return null;
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return _socket;
}

export function connectSocket(token: string): void {
  const s = getSocket();
  if (!s) return;
  s.auth = { token };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (_socket?.connected) _socket.disconnect();
}

export function emitEvent(event: string, data: unknown): void {
  const s = getSocket();
  if (!s?.connected) return;
  s.emit(event, data);
}

export function onEvent(event: string, handler: (...args: unknown[]) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}

export const SOCKET_EVENTS = {
  SEND_MESSAGE: "message:send",
  NEW_MESSAGE: "message:new",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  MESSAGE_READ: "message:read",
  CALL_INVITE: "call:invite",
  CALL_ANSWER: "call:answer",
  CALL_END: "call:end",
} as const;
