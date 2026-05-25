// Re-export the configured Supabase client from src/config
export {
  supabase,
  isSupabaseConfigured as isSupabaseEnvConfigured,
  type SupabaseClient,
} from "../src/config/supabase";
