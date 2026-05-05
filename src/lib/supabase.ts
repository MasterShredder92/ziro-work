import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side DB for service-role reads/writes.
 * Defaults to NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * If you migrated rows to TARGET_* but have not switched NEXT_PUBLIC yet,
 * set ZIRO_SERVER_USE_TARGET_SUPABASE=1 and keep TARGET_SUPABASE_* filled.
 * Long-term, point NEXT_PUBLIC_* at the same Supabase project you ship.
 */
function resolveServerSupabaseConfig(): { url: string; key: string } {
  const useTarget =
    process.env.ZIRO_SERVER_USE_TARGET_SUPABASE === "1" ||
    process.env.ZIRO_SERVER_USE_TARGET_SUPABASE === "true";
  if (useTarget) {
    const url = process.env.TARGET_SUPABASE_URL?.trim();
    const key = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (url && key) {
      return { url, key };
    }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

type GlobalWithClients = typeof globalThis & {
  __ziro_supabase_service?: SupabaseClient;
};

const g = globalThis as GlobalWithClients;

export function getServiceClient(): SupabaseClient {
  if (g.__ziro_supabase_service) return g.__ziro_supabase_service;
  const { url, key } = resolveServerSupabaseConfig();
  g.__ziro_supabase_service = createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return g.__ziro_supabase_service;
}
