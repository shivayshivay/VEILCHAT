import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@veilchat/adaptive_key_v1";
const ENABLED_KEY = "@veilchat/adaptive_enabled_v1";

function generateKeyHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function keyFingerprint(hex: string): string {
  return hex.slice(0, 8).toUpperCase();
}

interface AdaptiveState {
  keyHex: string | null;
  fingerprint: string | null;
  isEnabled: boolean;
  isInitialized: boolean;
}

interface AdaptiveActions {
  initialize: () => Promise<void>;
  toggleEnabled: () => Promise<void>;
  resetKey: () => Promise<void>;
}

export const useAdaptiveStore = create<AdaptiveState & AdaptiveActions>()(
  (set, get) => ({
    keyHex: null,
    fingerprint: null,
    isEnabled: false,
    isInitialized: false,

    initialize: async () => {
      if (get().isInitialized) return;
      try {
        let key = await AsyncStorage.getItem(STORAGE_KEY);
        if (!key) {
          key = generateKeyHex();
          await AsyncStorage.setItem(STORAGE_KEY, key);
        }
        const enabledStr = await AsyncStorage.getItem(ENABLED_KEY);
        set({
          keyHex: key,
          fingerprint: keyFingerprint(key),
          isEnabled: enabledStr === "true",
          isInitialized: true,
        });
      } catch {
        // Even if storage fails, generate an in-memory key
        const key = generateKeyHex();
        set({
          keyHex: key,
          fingerprint: keyFingerprint(key),
          isEnabled: false,
          isInitialized: true,
        });
      }
    },

    toggleEnabled: async () => {
      const next = !get().isEnabled;
      set({ isEnabled: next });
      try {
        await AsyncStorage.setItem(ENABLED_KEY, String(next));
      } catch {}
    },

    resetKey: async () => {
      const key = generateKeyHex();
      try {
        await AsyncStorage.setItem(STORAGE_KEY, key);
      } catch {}
      set({ keyHex: key, fingerprint: keyFingerprint(key) });
    },
  }),
);
