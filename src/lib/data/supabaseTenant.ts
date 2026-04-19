import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/supabase";

type GlobalWithCache = typeof globalThis & {
  __ziro_tenant_clients?: Map<string, SupabaseClient>;
};

const g = globalThis as GlobalWithCache;
const tenantClients: Map<string, SupabaseClient> =
  g.__ziro_tenant_clients ?? (g.__ziro_tenant_clients = new Map());

export function getSupabaseTenant(tenantId: string): SupabaseClient {
  if (typeof window === "undefined") {
    return getServiceClient();
  }
  const cached = tenantClients.get(tenantId);
  if (cached) return cached;
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "public" },
      global: {
        headers: { "x-tenant-id": tenantId },
        fetch: (url: string | URL | globalThis.Request, options: RequestInit = {}) => {
          const mergedHeaders = new Headers(options.headers ?? undefined);
          mergedHeaders.set("x-tenant-id", tenantId);
          return fetch(url, {
            ...options,
            headers: mergedHeaders,
          });
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  ) as SupabaseClient;
  tenantClients.set(tenantId, client);
  return client;
}
