import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { VeilUser } from "@/types/auth";

const AVATAR_COLORS = [
  "#00F5D4", "#7C3AED", "#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#EC4899",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

interface AuthStore {
  user: VeilUser | null;
  isLoading: boolean;
  pendingPhone: string;
  error: string | null;

  get isAuthenticated(): boolean;

  setPendingPhone: (phone: string) => void;
  setError: (error: string | null) => void;

  login: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  setupProfile: (name: string, bio: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      pendingPhone: "",
      error: null,

      get isAuthenticated() {
        return get().user !== null;
      },

      setPendingPhone: (phone) => set({ pendingPhone: phone, error: null }),
      setError: (error) => set({ error }),

      login: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 800));
          set({ pendingPhone: phone });
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Login failed" });
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 700));
          if (otp !== "123456") {
            set({ error: "Invalid verification code", isLoading: false });
            return false;
          }
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Verification failed", isLoading: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setupProfile: async (name: string, bio: string) => {
        set({ isLoading: true, error: null });
        try {
          const newUser: VeilUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            name,
            phone: get().pendingPhone,
            bio,
            avatarColor: randomAvatarColor(),
            createdAt: Date.now(),
          };
          set({ user: newUser });
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Profile setup failed" });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ user: null, pendingPhone: "", error: null });
      },
    }),
    {
      name: "veilchat-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
