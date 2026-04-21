import { NextResponse } from "next/server";
import { badRequest, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { dispatchAutomationEvent } from "@/lib/automation/engine";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
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
        const body = await readJson(req);
        if (!body || typeof body.event !== "string" || !body.event.trim()) {
            return badRequest("'event' is required.");
        }
        const tenantId = session.tenantId || body.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_c) {
            return forbidden("TENANT_MISMATCH");
        }
        const executions = await dispatchAutomationEvent(body.event.trim(), {
            tenantId,
            profileId: (_a = body.profileId) !== null && _a !== void 0 ? _a : session.userId,
            conversationId: body.conversationId,
            locationId: body.locationId,
            data: body.data,
            occurredAt: body.occurredAt,
        });
        await logAudit("automation.api.dispatch", {
            tenantId,
            profileId: session.userId,
            event: body.event,
            executionCount: executions.length,
            ok: executions.every((e) => e.ok),
        });
        return ok({ data: { executions } });
    }
    catch (err) {
        return serverError(err);
    }
}
