import { createClient } from "@supabase/supabase-js";
/**
 * Server-side DB for service-role reads/writes.
 * Defaults to NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * If you migrated rows to TARGET_* but have not switched NEXT_PUBLIC yet,
 * set ZIRO_SERVER_USE_TARGET_SUPABASE=1 and keep TARGET_SUPABASE_* filled.
 * Long-term, point NEXT_PUBLIC_* at the same Supabase project you ship.
 */
function resolveServerSupabaseConfig() {
    var _a, _b;
    const useTarget = process.env.ZIRO_SERVER_USE_TARGET_SUPABASE === "1" ||
        process.env.ZIRO_SERVER_USE_TARGET_SUPABASE === "true";
    if (useTarget) {
        const url = (_a = process.env.TARGET_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
        const key = (_b = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY) === null || _b === void 0 ? void 0 : _b.trim();
        if (url && key) {
            return { url, key };
        }
    }
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
}
const g = globalThis;
export function getServiceClient() {
    if (g.__ziro_supabase_service)
        return g.__ziro_supabase_service;
    const { url, key } = resolveServerSupabaseConfig();
    console.log("Supabase URL:", url);
    console.log("Supabase Key:", key ? "********" : "[MISSING]");
    g.__ziro_supabase_service = createClient(url, key, {
        db: { schema: "public" },
        global: {
            headers: { 'x-tenant-id': 'default' },
        },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return g.__ziro_supabase_service;
}
