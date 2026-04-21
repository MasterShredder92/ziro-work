import { NextResponse } from "next/server";
import { ok, resolveTenantId, serverError } from "@/lib/http";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listReports } from "@/lib/reports/service";
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
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const reports = await listReports();
        await logAudit("reports.list.api", {
            tenantId,
            profileId: (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null,
            count: reports.length,
        });
        return ok({ data: reports });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return forbidden();
        }
        return serverError(err);
    }
}
