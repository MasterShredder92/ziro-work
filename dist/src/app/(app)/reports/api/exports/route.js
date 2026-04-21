/**
 * List export jobs for the tenant. Supports ?reportId= and ?limit=.
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { ok, resolveTenantId, serverError } from "@/lib/http";
import { listExportJobs } from "@/lib/reports/exportService";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a, _b;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_c) {
            return forbidden();
        }
        const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
        }
        const url = new URL(req.url);
        const reportId = (_b = url.searchParams.get("reportId")) !== null && _b !== void 0 ? _b : undefined;
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : 50;
        const jobs = await listExportJobs(tenantId, { reportId, limit });
        return ok({ data: jobs });
    }
    catch (err) {
        return serverError(err);
    }
}
