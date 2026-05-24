import { create } from "zustand";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };

interface UiStore {
  isGlobalLoading: boolean;
  toasts: Toast[];
  activeCallContactId: string | null;
  callTimer: number;
  callTimerRef: ReturnType<typeof setInterval> | null;

  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: string) => void;
  startCall: (contactId: string) => void;
  endCall: () => void;
  tickCallTimer: () => void;
}

export const useUiStore = create<UiStore>()((set, get) => ({
  isGlobalLoading: false,
  toasts: [],
  activeCallContactId: null,
  callTimer: 0,
  callTimerRef: null,

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  showToast: (message, type = "info") => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  startCall: (contactId) => {
    const ref = setInterval(() => get().tickCallTimer(), 1000);
    set({ activeCallContactId: contactId, callTimer: 0, callTimerRef: ref });
  },

  endCall: () => {
    const { callTimerRef } = get();
    if (callTimerRef) clearInterval(callTimerRef);
    set({ activeCallContactId: null, callTimer: 0, callTimerRef: null });
  },

  tickCallTimer: () => set((s) => ({ callTimer: s.callTimer + 1 })),
}));
