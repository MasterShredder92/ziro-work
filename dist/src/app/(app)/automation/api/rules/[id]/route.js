import { NextResponse } from "next/server";
import { badRequest, noContent, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { deleteAutomationRule, getAutomationRule, updateAutomationRule, } from "@/lib/automation/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    try {
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
        const { id } = await params;
        const rule = await getAutomationRule(id, tenantId);
        if (!rule)
            return notFound("Automation rule not found.");
        return ok({ data: rule });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function PATCH(req, { params }) {
    try {
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
        const { id } = await params;
        const body = await readJson(req);
        if (!body)
            return badRequest("Request body is required.");
        const rule = await updateAutomationRule(id, tenantId, body);
        await logAudit("automation.api.rules.update", {
            tenantId,
            profileId: session.userId,
            ruleId: rule.id,
            name: rule.name,
        });
        return ok({ data: rule });
    }
    catch (err) {
        if (err instanceof Error && err.message === "AUTOMATION_RULE_NOT_FOUND") {
            return notFound("Automation rule not found.");
        }
        return serverError(err);
    }
}
export async function DELETE(req, { params }) {
    try {
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
        const { id } = await params;
        await deleteAutomationRule(id, tenantId);
        await logAudit("automation.api.rules.delete", {
            tenantId,
            profileId: session.userId,
            ruleId: id,
        });
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
