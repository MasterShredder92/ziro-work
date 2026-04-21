import { NextResponse } from "next/server";
import { badRequest, created, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { createAutomationRule, listAutomationRules, } from "@/lib/automation/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
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
        const rules = await listAutomationRules(tenantId);
        await logAudit("automation.api.rules.list", {
            tenantId,
            profileId: session.userId,
            count: rules.length,
        });
        return ok({ data: rules });
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
            return badRequest("Automation rule 'name' is required.");
        }
        if (!body.trigger || typeof body.trigger.event !== "string") {
            return badRequest("Automation rule 'trigger.event' is required.");
        }
        const rule = await createAutomationRule(tenantId, Object.assign(Object.assign({}, body), { createdBy: session.userId }));
        await logAudit("automation.api.rules.create", {
            tenantId,
            profileId: session.userId,
            ruleId: rule.id,
            name: rule.name,
            trigger: (_a = rule.trigger) === null || _a === void 0 ? void 0 : _a.event,
        });
        return created({ data: rule });
    }
    catch (err) {
        return serverError(err);
    }
}
