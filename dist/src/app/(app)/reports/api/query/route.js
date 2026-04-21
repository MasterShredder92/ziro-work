/**
 * Run an ad-hoc ReportQuery without persisting it.
 * POST /reports/api/query
 *   body: { query: ReportQuery }
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { badRequest, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { runQuery } from "@/lib/reports/queryEngine";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_d) {
            return forbidden();
        }
        const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
        }
        const body = (_b = (await readJson(req))) !== null && _b !== void 0 ? _b : {};
        if (!body.query || typeof body.query !== "object" || !body.query.source) {
            return badRequest("query.source is required");
        }
        const started = Date.now();
        const result = await runQuery(body.query, tenantId);
        await logAudit("reports.query.run", {
            tenantId,
            profileId: (_c = session === null || session === void 0 ? void 0 : session.userId) !== null && _c !== void 0 ? _c : null,
            source: body.query.source,
            rowCount: result.rows.length,
            durationMs: Date.now() - started,
        });
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
