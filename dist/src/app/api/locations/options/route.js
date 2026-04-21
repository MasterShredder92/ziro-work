import { getSession } from "@/lib/auth/session";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req) {
    var _a;
    void _req;
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ data: [], tenantId: DEFAULT_TENANT_ID }, { status: 200 });
        }
        const access = await resolveUserLocationAccess({
            session,
            autoRepairProfileLocation: true,
        });
        return Response.json({ data: (_a = access.locations) !== null && _a !== void 0 ? _a : [], tenantId: access.tenantId || DEFAULT_TENANT_ID }, { status: 200 });
    }
    catch (_b) {
        return Response.json({ data: [], tenantId: DEFAULT_TENANT_ID }, { status: 200 });
    }
}
