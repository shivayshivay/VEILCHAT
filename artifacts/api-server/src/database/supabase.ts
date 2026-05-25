import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!_client) {
    _client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const keyType = env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon";
    logger.info({ keyType }, "Supabase client initialized");
  }

  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
}

export async function supabaseHealthCheck(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from("users").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
