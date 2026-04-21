import { NextResponse } from "next/server";
import { ok, resolveTenantId, serverError } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listRuns } from "@/lib/automation/workflows/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        let session;
        try {
            session = await requirePermission("automation.read")();
        }
        catch (_h) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_j) {
            return forbidden("TENANT_MISMATCH");
        }
        const url = new URL(req.url);
        const workflowId = (_a = url.searchParams.get("workflowId")) !== null && _a !== void 0 ? _a : undefined;
        const status = (_b = url.searchParams.get("status")) !== null && _b !== void 0 ? _b : undefined;
        const triggerType = (_c = url.searchParams.get("triggerType")) !== null && _c !== void 0 ? _c : undefined;
        const since = (_d = url.searchParams.get("since")) !== null && _d !== void 0 ? _d : undefined;
        const limit = Number((_e = url.searchParams.get("limit")) !== null && _e !== void 0 ? _e : "50");
        const offset = Number((_f = url.searchParams.get("offset")) !== null && _f !== void 0 ? _f : "0");
        const runs = await listRuns(tenantId, {
            workflowId: workflowId !== null && workflowId !== void 0 ? workflowId : undefined,
            status: (_g = status) !== null && _g !== void 0 ? _g : undefined,
            triggerType: triggerType !== null && triggerType !== void 0 ? triggerType : undefined,
            since: since !== null && since !== void 0 ? since : undefined,
        }, {
            limit: Number.isFinite(limit) ? Math.min(limit, 500) : 50,
            offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
        });
        await logAudit("automation.api.runs.list", {
            tenantId,
            profileId: session.userId,
            count: runs.length,
        });
        return ok({ data: runs });
    }
    catch (err) {
        return serverError(err);
    }
}
