var _a;
import { createBrowserClient } from "@supabase/ssr";
import { getServiceClient } from "@/lib/supabase";
const g = globalThis;
const tenantClients = (_a = g.__ziro_data_tenant_clients) !== null && _a !== void 0 ? _a : (g.__ziro_data_tenant_clients = new Map());
function buildTenantClient(tenantId) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return createBrowserClient(url, anonKey, {
        db: { schema: "public" },
        global: {
            headers: { "x-tenant-id": tenantId },
            fetch: (input, init) => {
                var _a;
                return fetch(input, Object.assign(Object.assign({}, init), { headers: Object.assign(Object.assign({}, ((_a = init === null || init === void 0 ? void 0 : init.headers) !== null && _a !== void 0 ? _a : {})), { "x-tenant-id": tenantId }) }));
            },
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: `sb-tenant-${tenantId}-auth-token`,
        },
    });
}
export function tenantClient(tenantId) {
    const cached = tenantClients.get(tenantId);
    if (cached)
        return cached;
    const client = buildTenantClient(tenantId);
    tenantClients.set(tenantId, client);
    return client;
}
export function clientFor(tenantId) {
    if (typeof window === "undefined")
        return getServiceClient();
    if (tenantId && tenantId.trim().length > 0)
        return tenantClient(tenantId);
    return getServiceClient();
}
export function serviceClient() {
    return getServiceClient();
}
export function applyListOptions(query, opts) {
    var _a;
    let q = query;
    if (opts === null || opts === void 0 ? void 0 : opts.orderBy) {
        q = q.order(opts.orderBy, { ascending: (_a = opts.ascending) !== null && _a !== void 0 ? _a : false });
    }
    if (typeof (opts === null || opts === void 0 ? void 0 : opts.offset) === "number" && typeof (opts === null || opts === void 0 ? void 0 : opts.limit) === "number") {
        q = q.range(opts.offset, opts.offset + opts.limit - 1);
    }
    else if (typeof (opts === null || opts === void 0 ? void 0 : opts.limit) === "number") {
        q = q.limit(opts.limit);
    }
    return q;
}
