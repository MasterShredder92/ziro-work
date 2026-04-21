import { NextResponse } from "next/server";
import { badRequest, notFound, ok, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadSurface } from "@/lib/leads/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    var _a;
    try {
        let session;
        try {
            session = await requirePermission("leads.read")();
        }
        catch (_b) {
            return forbidden();
        }
        const resolved = await params;
        const leadId = resolved.id;
        if (!leadId || leadId.trim().length === 0) {
            return badRequest("Missing lead id");
        }
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const surface = await getLeadSurface(leadId, tenantId);
        if (!surface)
            return notFound("Lead not found");
        try {
            await assertTenantAccess(surface.detail.lead.tenant_id);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        await logAudit("leads.detail.view", {
            tenantId,
            leadId,
            profileId: session.userId,
            generatedAt: surface.generatedAt,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return forbidden();
        }
        return serverError(err);
    }
}
