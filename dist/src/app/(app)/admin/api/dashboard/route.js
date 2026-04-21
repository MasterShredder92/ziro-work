import { getAdminDashboard } from "@/lib/admin/service";
import { ok, resolveTenantId, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const tenantId = resolveTenantId(req);
        const data = await getAdminDashboard(tenantId);
        return ok({ tenantId, data });
    }
    catch (err) {
        return serverError(err);
    }
}
