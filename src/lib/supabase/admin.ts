import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, serverOnlyEnv } from "@/lib/env";

let _admin: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const { SERVICE_ROLE_KEY } = serverOnlyEnv();
  _admin = createClient(env.SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return _admin;
}
