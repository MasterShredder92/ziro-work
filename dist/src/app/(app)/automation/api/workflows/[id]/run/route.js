import { NextResponse } from "next/server";
import { notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { runWorkflowManually } from "@/lib/automation/workflows/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        let session;
        try {
            session = await requirePermission("automation.write")();
        }
        catch (_b) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_c) {
            return forbidden("TENANT_MISMATCH");
        }
        const body = await readJson(req);
        try {
            const run = await runWorkflowManually(id, tenantId, {
                payload: (_a = body === null || body === void 0 ? void 0 : body.payload) !== null && _a !== void 0 ? _a : {},
                triggeredBy: session.userId,
            });
            await logAudit("automation.api.workflows.run", {
                tenantId,
                profileId: session.userId,
                workflowId: id,
                runId: run.id,
            });
            return ok({ data: run });
        }
        catch (err) {
            if (err instanceof Error && err.message === "AUTOMATION_WORKFLOW_NOT_FOUND") {
                return notFound("Workflow not found.");
            }
            throw err;
        }
    }
    catch (err) {
        return serverError(err);
    }
}
