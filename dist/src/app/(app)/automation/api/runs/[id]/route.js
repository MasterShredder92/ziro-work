import { NextResponse } from "next/server";
import { notFound, ok, resolveTenantId, serverError } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getRunSurface } from "@/lib/automation/workflows/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        let session;
        try {
            session = await requirePermission("automation.read")();
        }
        catch (_a) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_b) {
            return forbidden("TENANT_MISMATCH");
        }
        const surface = await getRunSurface(id, tenantId);
        if (!surface)
            return notFound("Run not found.");
        await logAudit("automation.api.runs.get", {
            tenantId,
            profileId: session.userId,
            runId: id,
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}
