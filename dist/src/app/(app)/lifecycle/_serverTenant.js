import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getSession } from "@/lib/auth/session";
function pickTenantIdFromMetadata(user) {
    var _a, _b;
    const app = (_a = user.app_metadata) !== null && _a !== void 0 ? _a : {};
    const meta = (_b = user.user_metadata) !== null && _b !== void 0 ? _b : {};
    const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }
    return "";
}
export async function resolveLifecycleTenantId() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey)
        return DEFAULT_TENANT_ID;
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll().map((cookie) => ({
                    name: cookie.name,
                    value: cookie.value,
                }));
            },
            setAll(cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                }
                catch (_a) {
                    return;
                }
            },
        },
    });
    const { data: { session }, } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const tenantId = ((session === null || session === void 0 ? void 0 : session.user) ? pickTenantIdFromMetadata(session.user) : "") || DEFAULT_TENANT_ID;
    return tenantId;
}
export async function resolveLifecycleTenantScope(preferredLocationId) {
    var _a;
    try {
        const session = await requirePermission("students.read")();
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId,
            autoRepairProfileLocation: true,
        });
        const locationId = preferredLocationId && preferredLocationId.trim().length > 0
            ? access.selectedLocationId
            : null;
        return { tenantId: access.tenantId, locationId };
    }
    catch (_b) {
        const session = await getSession().catch(() => null);
        const tenantId = ((_a = session === null || session === void 0 ? void 0 : session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
        return { tenantId, locationId: null };
    }
}
