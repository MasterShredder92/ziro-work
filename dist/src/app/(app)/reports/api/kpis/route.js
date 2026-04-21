/**
 * KPI snapshot endpoint.
 * GET  /reports/api/kpis               -> list KPI definitions
 * POST /reports/api/kpis               -> compute snapshot for given keys + range
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { computeSnapshot, listKpiDefinitions } from "@/lib/reports/kpis";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET() {
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_a) {
            return forbidden();
        }
        void session;
        return ok({ data: listKpiDefinitions() });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req) {
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
        const body = (_b = (await readJson(req))) !== null && _b !== void 0 ? _b : {};
        const snapshot = await computeSnapshot(tenantId, body.range, body.keys);
        return ok({ data: snapshot });
    }
    catch (err) {
        return serverError(err);
    }
}
