/**
 * Saved report by id.
 * GET    -> report + widgets
 * PATCH  -> update metadata / query / widgets
 * DELETE -> archive / remove
 */
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { noContent, notFound, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { deleteSavedReport, getSavedReport, updateSavedReport, } from "@/lib/reports/savedReports";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, ctx) {
    var _a;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_b) {
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
        const result = await getSavedReport(id, tenantId);
        if (!result)
            return notFound("Report not found");
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function PATCH(req, ctx) {
    var _a, _b, _c;
    try {
        let session;
        try {
            session = await requirePermission("reports.write")();
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
        const { id } = await ctx.params;
        const body = (_b = (await readJson(req))) !== null && _b !== void 0 ? _b : {};
        const result = await updateSavedReport(id, tenantId, body, (_c = session === null || session === void 0 ? void 0 : session.userId) !== null && _c !== void 0 ? _c : null);
        if (!result)
            return notFound("Report not found");
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function DELETE(req, ctx) {
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
        const { id } = await ctx.params;
        const okDelete = await deleteSavedReport(id, tenantId, (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null);
        if (!okDelete)
            return notFound("Report not found");
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
