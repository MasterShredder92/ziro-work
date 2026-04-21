import { NextResponse } from "next/server";
import { badRequest, created, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { createWorkflowForTenant, } from "@/lib/automation/workflows/service";
import { listWorkflows } from "@/lib/automation/workflows/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a, _b, _c;
    try {
        let session;
        try {
            session = await requirePermission("automation.read")();
        }
        catch (_d) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_e) {
            return forbidden("TENANT_MISMATCH");
        }
        const url = new URL(req.url);
        const status = (_a = url.searchParams.get("status")) !== null && _a !== void 0 ? _a : undefined;
        const triggerType = (_b = url.searchParams.get("triggerType")) !== null && _b !== void 0 ? _b : undefined;
        const search = (_c = url.searchParams.get("search")) !== null && _c !== void 0 ? _c : undefined;
        const workflows = await listWorkflows(tenantId, {
            status: status,
            triggerType: triggerType !== null && triggerType !== void 0 ? triggerType : undefined,
            search: search !== null && search !== void 0 ? search : undefined,
        });
        await logAudit("automation.api.workflows.list", {
            tenantId,
            profileId: session.userId,
            count: workflows.length,
        });
        return ok({ data: workflows });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req) {
    var _a;
    try {
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
        if (!body || typeof body.name !== "string" || !body.name.trim()) {
            return badRequest("Workflow 'name' is required.");
        }
        if (!body.trigger || typeof body.trigger.type !== "string") {
            return badRequest("Workflow 'trigger.type' is required.");
        }
        if (!Array.isArray(body.actions)) {
            return badRequest("Workflow 'actions' must be an array.");
        }
        const workflow = await createWorkflowForTenant(tenantId, Object.assign(Object.assign({}, body), { createdBy: session.userId }));
        await logAudit("automation.api.workflows.create", {
            tenantId,
            profileId: session.userId,
            workflowId: workflow.id,
            name: workflow.name,
            triggerType: (_a = workflow.trigger) === null || _a === void 0 ? void 0 : _a.type,
        });
        return created({ data: workflow });
    }
    catch (err) {
        return serverError(err);
    }
}
