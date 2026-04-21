import { NextResponse } from "next/server";
import { badRequest, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { runReport } from "@/lib/reports/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_j) {
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
        const body = await readJson(req);
        if (!body || typeof body.reportId !== "string" || body.reportId.trim().length === 0) {
            return badRequest("reportId is required");
        }
        const outcome = await runReport(body.reportId.trim(), (_b = body.params) !== null && _b !== void 0 ? _b : {}, {
            tenantId,
            profileId: (_c = session === null || session === void 0 ? void 0 : session.userId) !== null && _c !== void 0 ? _c : null,
            role: (_d = session === null || session === void 0 ? void 0 : session.role) !== null && _d !== void 0 ? _d : null,
        });
        if (!outcome.ok) {
            const code = (_f = (_e = outcome.error) === null || _e === void 0 ? void 0 : _e.code) !== null && _f !== void 0 ? _f : "ERROR";
            const message = (_h = (_g = outcome.error) === null || _g === void 0 ? void 0 : _g.message) !== null && _h !== void 0 ? _h : "Report run failed";
            if (code === "FORBIDDEN")
                return forbidden(message);
            if (code === "NOT_FOUND") {
                return NextResponse.json({ error: message }, { status: 404 });
            }
            return NextResponse.json({ error: message, execution: outcome.execution }, { status: 400 });
        }
        return ok({ data: outcome.result, execution: outcome.execution });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return forbidden();
        }
        return serverError(err);
    }
}
