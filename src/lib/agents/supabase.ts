import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type GlobalWithCache = typeof globalThis & {
  __ziro_agent_clients?: Map<string, SupabaseClient>;
};

const g = globalThis as GlobalWithCache;
const agentClients: Map<string, SupabaseClient> =
  g.__ziro_agent_clients ?? (g.__ziro_agent_clients = new Map());

export function getSupabase(tenantId: string): SupabaseClient {
  const cached = agentClients.get(tenantId);
  if (cached) return cached;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "public" },
      global: {
        headers: { "x-tenant-id": tenantId },
      },
      auth: { persistSession: false, autoRefreshToken: false },
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
        fetch(url, {
          ...options,
          headers: {
            ...((options.headers as Record<string, string> | undefined) || {}),
            "x-tenant-id": tenantId,
          },
        }),
    } as unknown as Parameters<typeof createClient>[2],
  );
  agentClients.set(tenantId, client);
  return client;
}
