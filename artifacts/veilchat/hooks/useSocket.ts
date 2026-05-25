import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export function useChatSocket() {
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const initSocketListeners = useChatStore((s) => s.initSocketListeners);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    // Use JWT access token for socket auth, fall back to user.id for demo mode
    const token = tokens?.accessToken ?? user.id;
    connectSocket(token);

    const cleanup = initSocketListeners();

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [user, tokens?.accessToken, initSocketListeners]);
}

export function useSocketStatus(): boolean {
  const socket = getSocket();
  return socket?.connected ?? false;
}
