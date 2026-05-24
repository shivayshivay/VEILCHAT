import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export function useChatSocket() {
  const user = useAuthStore((s) => s.user);
  const initSocketListeners = useChatStore((s) => s.initSocketListeners);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    connectSocket(user.id);

    const cleanup = initSocketListeners();

    return () => {
      cleanup();
    };
  }, [user, initSocketListeners]);
}

export function useSocketStatus(): boolean {
  const socket = getSocket();
  return socket?.connected ?? false;
}
