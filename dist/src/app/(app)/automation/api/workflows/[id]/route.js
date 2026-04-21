import { NextResponse } from "next/server";
import { badRequest, noContent, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { deleteWorkflowForTenant, updateWorkflowForTenant, } from "@/lib/automation/workflows/service";
import { getWorkflow } from "@/lib/automation/workflows/queries";
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
        const workflow = await getWorkflow(id, tenantId);
        if (!workflow)
            return notFound("Workflow not found.");
        return ok({ data: workflow });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        let session;
        try {
            session = await requirePermission("automation.write")();
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
        const body = await readJson(req);
        if (!body)
            return badRequest("Request body must be JSON.");
        try {
            const workflow = await updateWorkflowForTenant(id, tenantId, body);
            await logAudit("automation.api.workflows.update", {
                tenantId,
                profileId: session.userId,
                workflowId: id,
            });
            return ok({ data: workflow });
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
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        let session;
        try {
            session = await requirePermission("automation.write")();
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
        await deleteWorkflowForTenant(id, tenantId);
        await logAudit("automation.api.workflows.delete", {
            tenantId,
            profileId: session.userId,
            workflowId: id,
        });
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
