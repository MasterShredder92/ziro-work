import { NextResponse } from "next/server";
import { badRequest, notFound, ok, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadById } from "@/lib/leads/queries";
import { runLeadWorkflow } from "@/lib/leads/orchestrator";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a;
    try {
        let session;
        try {
            session = await requirePermission("leads.write")();
        }
        catch (_b) {
            return forbidden();
        }
        const url = new URL(req.url);
        const leadId = url.searchParams.get("leadId");
        if (!leadId || leadId.trim().length === 0) {
            return badRequest("Missing leadId");
        }
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const lead = await getLeadById(leadId, tenantId);
        if (!lead)
            return notFound("Lead not found");
        try {
            await assertTenantAccess(lead.tenant_id);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const workflow = await runLeadWorkflow(leadId, {
            tenantId: lead.tenant_id,
            profileId: session.userId,
        });
        await logAudit("leads.workflow.run", {
            tenantId: lead.tenant_id,
            leadId,
            profileId: session.userId,
            ok: workflow.ok,
            durationMs: workflow.durationMs,
            promoted: workflow.promoted,
            qualificationTier: workflow.qualificationTier,
            steps: workflow.steps.map((s) => {
                var _a, _b;
                return ({
                    step: s.step,
                    status: s.status,
                    durationMs: (_b = (_a = s.result) === null || _a === void 0 ? void 0 : _a.durationMs) !== null && _b !== void 0 ? _b : 0,
                });
            }),
        });
        return ok({ data: workflow });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return forbidden();
        }
        return serverError(err);
    }
}
