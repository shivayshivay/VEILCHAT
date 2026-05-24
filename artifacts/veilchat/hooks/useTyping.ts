import { useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { emitEvent, getSocket, SOCKET_EVENTS } from "@/lib/socket";

const TYPING_STOP_DELAY = 2500;

export function useTypingEmitter(contactId: string) {
  const user = useAuthStore((s) => s.user);
  const isTypingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    emitEvent(SOCKET_EVENTS.TYPING_STOP, {
      conversationId: `conv_${contactId}`,
      senderId: user?.id,
    });
  }, [contactId, user?.id]);

  const startTyping = useCallback(() => {
    if (!getSocket()?.connected) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitEvent(SOCKET_EVENTS.TYPING_START, {
        conversationId: `conv_${contactId}`,
        senderId: user?.id,
      });
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY);
  }, [contactId, user?.id, stopTyping]);

  return { startTyping, stopTyping };
}
