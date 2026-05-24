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
  pendingEmail: string;
  error: string | null;
  hasSeenOnboarding: boolean;

  get isAuthenticated(): boolean;

  setPendingPhone: (phone: string) => void;
  setPendingEmail: (email: string) => void;
  setError: (error: string | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;

  loginWithPhone: (phone: string) => Promise<void>;
  loginWithEmail: (email: string, password: string, isSignUp?: boolean) => Promise<boolean>;
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
      pendingEmail: "",
      error: null,
      hasSeenOnboarding: false,

      get isAuthenticated() {
        return get().user !== null;
      },

      setPendingPhone: (phone) => set({ pendingPhone: phone, error: null }),
      setPendingEmail: (email) => set({ pendingEmail: email, error: null }),
      setError: (error) => set({ error }),
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),

      loginWithPhone: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 900));
          set({ pendingPhone: phone });
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Failed to send code" });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithEmail: async (email: string, password: string, isSignUp = false) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 1000));
          if (password.length < 6) {
            set({ error: "Password must be at least 6 characters" });
            return false;
          }
          const newUser: VeilUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            name: email.split("@")[0],
            phone: "",
            email,
            bio: "",
            avatarColor: randomAvatarColor(),
            createdAt: Date.now(),
          };
          set({ user: newUser });
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Authentication failed" });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 800));
          if (otp !== "123456") {
            set({ error: "Incorrect code. Please try again." });
            return false;
          }
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Verification failed" });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setupProfile: async (name: string, bio: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 600));
          const newUser: VeilUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            name,
            phone: get().pendingPhone,
            email: get().pendingEmail,
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
        set({ user: null, pendingPhone: "", pendingEmail: "", error: null });
      },
    }),
    {
      name: "veilchat-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);
