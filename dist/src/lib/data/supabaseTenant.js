var _a;
import { createBrowserClient } from "@supabase/ssr";
import { getServiceClient } from "@/lib/supabase";
const g = globalThis;
const tenantClients = (_a = g.__ziro_tenant_clients) !== null && _a !== void 0 ? _a : (g.__ziro_tenant_clients = new Map());
export function getSupabaseTenant(tenantId) {
    if (typeof window === "undefined") {
        return getServiceClient();
    }
    const cached = tenantClients.get(tenantId);
    if (cached)
        return cached;
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        db: { schema: "public" },
        global: {
            headers: { "x-tenant-id": tenantId },
            fetch: (url, options = {}) => {
                var _a;
                const mergedHeaders = new Headers((_a = options.headers) !== null && _a !== void 0 ? _a : undefined);
                mergedHeaders.set("x-tenant-id", tenantId);
                return fetch(url, Object.assign(Object.assign({}, options), { headers: mergedHeaders }));
            },
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
    tenantClients.set(tenantId, client);
    return client;
}
