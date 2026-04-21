import { NextResponse } from "next/server";
import { ok, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadDashboard } from "@/lib/leads/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
function parseFilters(url) {
    const filters = {};
    const stage = url.searchParams.get("stage");
    const source = url.searchParams.get("source");
    const assignedTo = url.searchParams.get("assignedTo");
    const locationId = url.searchParams.get("locationId");
    const search = url.searchParams.get("q");
    if (stage)
        filters.stage = stage;
    if (source)
        filters.source = source;
    if (assignedTo)
        filters.assignedTo = assignedTo;
    if (locationId)
        filters.locationId = locationId;
    if (search)
        filters.search = search;
    return filters;
}
export async function GET(req) {
    var _a;
    try {
        let session;
        try {
            session = await requirePermission("leads.read")();
        }
        catch (_b) {
            return forbidden();
        }
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const url = new URL(req.url);
        const filters = parseFilters(url);
        const data = await getLeadDashboard(tenantId, filters);
        await logAudit("leads.dashboard.view", {
            tenantId,
            profileId: session.userId,
            filters,
            generatedAt: data.generatedAt,
            source: "api",
        });
        return ok({ data });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return forbidden();
        }
        return serverError(err);
    }
}
