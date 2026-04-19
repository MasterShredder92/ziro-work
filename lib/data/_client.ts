import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/supabase";

type GlobalWithCache = typeof globalThis & {
  __ziro_data_tenant_clients?: Map<string, SupabaseClient>;
};

const g = globalThis as GlobalWithCache;
const tenantClients: Map<string, SupabaseClient> =
  g.__ziro_data_tenant_clients ?? (g.__ziro_data_tenant_clients = new Map());

function buildTenantClient(tenantId: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, anonKey, {
    db: { schema: "public" },
    global: {
      headers: { "x-tenant-id": tenantId },
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...((init?.headers as Record<string, string> | undefined) ?? {}),
            "x-tenant-id": tenantId,
          },
        }),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `sb-tenant-${tenantId}-auth-token`,
    },
  }) as SupabaseClient;
}

export function tenantClient(tenantId: string): SupabaseClient {
  const cached = tenantClients.get(tenantId);
  if (cached) return cached;
  const client = buildTenantClient(tenantId);
  tenantClients.set(tenantId, client);
  return client;
}

export function clientFor(tenantId: string | null | undefined): SupabaseClient {
  if (typeof window === "undefined") return getServiceClient();
  if (tenantId && tenantId.trim().length > 0) return tenantClient(tenantId);
  return getServiceClient();
}

export function serviceClient(): SupabaseClient {
  return getServiceClient();
}

export type ListOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
};

export function applyListOptions<T extends { limit: (n: number) => unknown; range: (a: number, b: number) => unknown; order: (c: string, o: { ascending: boolean }) => unknown }>(
  query: T,
  opts?: ListOptions,
): T {
  let q = query;
  if (opts?.orderBy) {
    q = q.order(opts.orderBy, { ascending: opts.ascending ?? false }) as T;
  }
  if (typeof opts?.offset === "number" && typeof opts?.limit === "number") {
    q = q.range(opts.offset, opts.offset + opts.limit - 1) as T;
  } else if (typeof opts?.limit === "number") {
    q = q.limit(opts.limit) as T;
  }
  return q;
}
