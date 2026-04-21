/**
 * Run a saved report by id (or ad-hoc query).
 * POST /reports/api/catalog/[id]/run
 *   body: { params?: Record, query?: ReportQuery }
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { badRequest, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getSavedReport } from "@/lib/reports/savedReports";
import { runQuery } from "@/lib/reports/queryEngine";
import { runReport } from "@/lib/reports/service";
import { listReportDefinitions } from "@/lib/reports/definitions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_m) {
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
        const builtInIds = new Set(listReportDefinitions().map((d) => d.id));
        if (builtInIds.has(id)) {
            const outcome = await runReport(id, (_c = body.params) !== null && _c !== void 0 ? _c : {}, {
                tenantId,
                profileId: (_d = session === null || session === void 0 ? void 0 : session.userId) !== null && _d !== void 0 ? _d : null,
                role: (_e = session === null || session === void 0 ? void 0 : session.role) !== null && _e !== void 0 ? _e : null,
            });
            if (!outcome.ok) {
                const code = (_g = (_f = outcome.error) === null || _f === void 0 ? void 0 : _f.code) !== null && _g !== void 0 ? _g : "ERROR";
                const message = (_j = (_h = outcome.error) === null || _h === void 0 ? void 0 : _h.message) !== null && _j !== void 0 ? _j : "Report run failed";
                if (code === "FORBIDDEN")
                    return forbidden(message);
                if (code === "NOT_FOUND")
                    return NextResponse.json({ error: message }, { status: 404 });
                return NextResponse.json({ error: message, execution: outcome.execution }, { status: 400 });
            }
            return ok({ data: outcome.result, execution: outcome.execution });
        }
        const saved = await getSavedReport(id, tenantId);
        if (!saved)
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        const q = (_k = body.query) !== null && _k !== void 0 ? _k : saved.report.query;
        if (!q)
            return badRequest("Report has no query and no query was supplied");
        const started = Date.now();
        const result = await runQuery(q, tenantId);
        await logAudit("reports.run.saved", {
            tenantId,
            profileId: (_l = session === null || session === void 0 ? void 0 : session.userId) !== null && _l !== void 0 ? _l : null,
            reportId: id,
            rowCount: result.rows.length,
            durationMs: Date.now() - started,
        });
        return ok({ data: Object.assign(Object.assign({}, saved), { result }) });
    }
    catch (err) {
        return serverError(err);
    }
}
