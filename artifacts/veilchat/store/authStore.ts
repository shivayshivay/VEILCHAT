import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { VeilUser, AuthTokens } from "@/types/auth";
import { env, isFirebaseEnvConfigured } from "@/src/config/env";
import { FIREBASE_ERRORS } from "@/src/config/firebase";

const AVATAR_COLORS = [
  "#00F5D4", "#7C3AED", "#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#EC4899",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Ephemeral Firebase confirmation result — NOT stored in Zustand (not serializable)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _confirmationResult: any = null;

// Helper: exchange Firebase ID token for backend JWT
async function exchangeFirebaseToken(
  idToken: string
): Promise<AuthTokens | null> {
  const baseUrl = env.api.baseUrl;
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/auth/verify-firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const tokens = body?.data?.tokens;
    if (tokens?.accessToken && tokens?.refreshToken) return tokens as AuthTokens;
    return null;
  } catch {
    return null;
  }
}

interface AuthStore {
  user: VeilUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  pendingPhone: string;
  pendingEmail: string;
  error: string | null;
  hasSeenOnboarding: boolean;

  get isAuthenticated(): boolean;
  get accessToken(): string | null;

  setPendingPhone: (phone: string) => void;
  setPendingEmail: (email: string) => void;
  setError: (error: string | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;

  // appVerifier: optional ApplicationVerifier (expo-firebase-recaptcha ref)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loginWithPhone: (phone: string, appVerifier?: any) => Promise<void>;
  loginWithEmail: (email: string, password: string, isSignUp?: boolean) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  setupProfile: (name: string, bio: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      pendingPhone: "",
      pendingEmail: "",
      error: null,
      hasSeenOnboarding: false,

      get isAuthenticated() {
        return get().user !== null;
      },

      get accessToken() {
        return get().tokens?.accessToken ?? null;
      },

      setPendingPhone: (phone) => set({ pendingPhone: phone, error: null }),
      setPendingEmail: (email) => set({ pendingEmail: email, error: null }),
      setError: (error) => set({ error }),
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),

      loginWithPhone: async (phone: string, appVerifier?: unknown) => {
        set({ isLoading: true, error: null });
        _confirmationResult = null;
        try {
          if (isFirebaseEnvConfigured && appVerifier) {
            // Real Firebase Phone Auth
            const { firebaseAuth } = await import("@/src/config/firebase");
            if (firebaseAuth) {
              const { signInWithPhoneNumber } = await import("firebase/auth");
              _confirmationResult = await signInWithPhoneNumber(
                firebaseAuth,
                phone,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                appVerifier as any
              );
              set({ pendingPhone: phone });
              return;
            }
          }
          // Demo mode: simulate SMS send
          console.info("[auth] Demo mode — OTP will not be sent via SMS. Use code: 123456");
          await new Promise((r) => setTimeout(r, 900));
          set({ pendingPhone: phone });
        } catch (e: unknown) {
          const code = (e as { code?: string }).code ?? "";
          const msg = FIREBASE_ERRORS[code] ?? (e instanceof Error ? e.message : "Failed to send code");
          set({ error: msg });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithEmail: async (email: string, password: string, isSignUp = false) => {
        set({ isLoading: true, error: null });
        try {
          if (isFirebaseEnvConfigured) {
            const { firebaseAuth } = await import("@/src/config/firebase");
            if (firebaseAuth) {
              const {
                signInWithEmailAndPassword,
                createUserWithEmailAndPassword,
              } = await import("firebase/auth");
              const credential = isSignUp
                ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
                : await signInWithEmailAndPassword(firebaseAuth, email, password);
              const idToken = await credential.user.getIdToken();
              const tokens = await exchangeFirebaseToken(idToken);
              const newUser: VeilUser = {
                id: credential.user.uid,
                name: credential.user.displayName ?? email.split("@")[0],
                phone: "",
                email,
                bio: "",
                avatarColor: randomAvatarColor(),
                createdAt: Date.now(),
                firebaseUid: credential.user.uid,
              };
              set({ user: newUser, tokens });
              return true;
            }
          }
          // Demo mode
          if (password.length < 6) {
            set({ error: "Password must be at least 6 characters" });
            return false;
          }
          await new Promise((r) => setTimeout(r, 1000));
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
          const code = (e as { code?: string }).code ?? "";
          const msg = FIREBASE_ERRORS[code] ?? (e instanceof Error ? e.message : "Authentication failed");
          set({ error: msg });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (otp: string) => {
        set({ isLoading: true, error: null });
        try {
          if (_confirmationResult) {
            // Real Firebase OTP verification
            const result = await _confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();
            _confirmationResult = null;

            // Try to get JWT from backend
            const tokens = await exchangeFirebaseToken(idToken);
            set({ tokens });
            return true;
          }

          // Demo mode: accept hardcoded code
          await new Promise((r) => setTimeout(r, 800));
          if (otp !== "123456") {
            set({ error: "Incorrect code. Please try again." });
            return false;
          }
          return true;
        } catch (e: unknown) {
          _confirmationResult = null;
          const code = (e as { code?: string }).code ?? "";
          const msg = FIREBASE_ERRORS[code] ?? (e instanceof Error ? e.message : "Verification failed");
          set({ error: msg });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setupProfile: async (name: string, bio: string) => {
        set({ isLoading: true, error: null });
        try {
          const { tokens } = get();

          // Try to persist profile to backend if JWT available
          if (tokens?.accessToken && env.api.baseUrl) {
            try {
              await fetch(`${env.api.baseUrl}/auth/setup-profile`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
                body: JSON.stringify({ name, bio }),
              });
            } catch {
              // Backend not available, continue locally
            }
          }

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
        try {
          if (isFirebaseEnvConfigured) {
            const { firebaseAuth } = await import("@/src/config/firebase");
            if (firebaseAuth) {
              const { signOut } = await import("firebase/auth");
              await signOut(firebaseAuth).catch(() => {});
            }
          }
        } catch {}
        _confirmationResult = null;
        set({ user: null, tokens: null, pendingPhone: "", pendingEmail: "", error: null });
      },
    }),
    {
      name: "veilchat-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);
