/**
 * Reports catalog endpoint.
 * GET  /reports/api/catalog -> list saved reports (custom) + built-in summaries
 * POST /reports/api/catalog -> create a saved (custom) report
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, created, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { listReports as listBuiltInReports } from "@/lib/reports/service";
import { createSavedReport, listSavedReports, } from "@/lib/reports/savedReports";
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
        const [builtIn, saved] = await Promise.all([
            listBuiltInReports(),
            listSavedReports(tenantId),
        ]);
        await logAudit("reports.catalog.api", {
            tenantId,
            profileId: (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null,
            builtIn: builtIn.length,
            saved: saved.length,
        });
        return ok({ data: { builtIn, saved } });
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
            session = await requirePermission("reports.write")();
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
        const body = await readJson(req);
        if (!body || typeof body.name !== "string" || body.name.trim().length === 0) {
            return badRequest("name is required");
        }
        const result = await createSavedReport(tenantId, body, (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null);
        return created({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
