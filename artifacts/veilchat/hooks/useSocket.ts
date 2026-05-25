import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export function useChatSocket() {
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const initialize = useChatStore((s) => s.initialize);
  const reset = useChatStore((s) => s.reset);
  const initSocketListeners = useChatStore((s) => s.initSocketListeners);

  useEffect(() => {
    if (!user) {
      // Clear chat state when user logs out
      reset();
      disconnectSocket();
      return;
    }

    const accessToken = tokens?.accessToken;
    if (!accessToken) return;

    // Connect socket with JWT access token
    const socket = getSocket();
    if (socket) connectSocket(accessToken);

    // Initialize chat (load conversations from API + set up Supabase realtime)
    initialize(user.id, accessToken).catch(console.warn);

    // Register socket event listeners for typing, read receipts, etc.
    const cleanup = initSocketListeners();

    return () => {
      cleanup();
    };
  }, [user?.id, tokens?.accessToken]);

  // Separate effect: disconnect on unmount only
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);
}

export function useSocketStatus(): boolean {
  const socket = getSocket();
  return socket?.connected ?? false;
}
