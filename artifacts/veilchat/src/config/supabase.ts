import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseEnvConfigured } from "./env";

function initSupabase(): SupabaseClient | null {
  if (!isSupabaseEnvConfigured) {
    console.warn("[supabase] Supabase is not configured — skipping initialization");
    return null;
  }

  try {
    const client = createClient(env.supabase.url, env.supabase.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return client;
  } catch (error) {
    console.error("[supabase] Initialization error:", error);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabase();

export { isSupabaseEnvConfigured as isSupabaseConfigured };

export type { SupabaseClient };
