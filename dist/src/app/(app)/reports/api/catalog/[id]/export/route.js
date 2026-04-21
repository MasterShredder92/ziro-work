/**
 * Queue an export job for a saved or built-in report.
 * POST /reports/api/catalog/[id]/export
 *   body: { format: 'csv'|'xlsx'|'pdf', params?, query? }
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { badRequest, created, readJson, resolveTenantId, serverError } from "@/lib/http";
import { queueReportExport } from "@/lib/reports/exportService";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
const ALLOWED = ["csv", "xlsx", "pdf"];
export async function POST(req, ctx) {
    var _a, _b, _c, _d, _e;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_f) {
            return forbidden();
        }
        const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
        }
        const { id } = await ctx.params;
        const body = (_b = (await readJson(req))) !== null && _b !== void 0 ? _b : {};
        const format = body.format;
        if (!format || !ALLOWED.includes(format)) {
            return badRequest("format must be one of csv|xlsx|pdf");
        }
        const job = await queueReportExport(tenantId, {
            reportId: id,
            format,
            params: (_c = body.params) !== null && _c !== void 0 ? _c : null,
            query: (_d = body.query) !== null && _d !== void 0 ? _d : null,
        }, (_e = session === null || session === void 0 ? void 0 : session.userId) !== null && _e !== void 0 ? _e : null);
        return created({ data: job });
    }
    catch (err) {
        return serverError(err);
    }
}
