import { NextResponse } from "next/server";
import { notFound, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { dispatchCustomWebhook } from "@/lib/automation/workflows/triggers";
import { getWorkflow } from "@/lib/automation/workflows/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function resolveWebhookTenant(req, existingTenant) {
    if (existingTenant && existingTenant.trim().length > 0)
        return existingTenant.trim();
    const header = req.headers.get("x-tenant-id");
    if (header && header.trim().length > 0)
        return header.trim();
    const url = new URL(req.url);
    const q = url.searchParams.get("tenantId");
    if (q && q.trim().length > 0)
        return q.trim();
    return DEFAULT_TENANT_ID;
}
export async function POST(req, { params }) {
    var _a, _b, _c;
    try {
        const { id } = await params;
        const headerTenant = resolveTenantId(req);
        let workflow = await getWorkflow(id, headerTenant);
        if (!workflow) {
            const fallbackTenant = resolveWebhookTenant(req, null);
            if (fallbackTenant !== headerTenant) {
                workflow = await getWorkflow(id, fallbackTenant);
            }
        }
        if (!workflow)
            return notFound("Webhook workflow not found.");
        if (workflow.status !== "active") {
            return NextResponse.json({ error: "WORKFLOW_INACTIVE" }, { status: 409 });
        }
        if (((_a = workflow.trigger) === null || _a === void 0 ? void 0 : _a.type) !== "custom.webhook") {
            return NextResponse.json({ error: "WORKFLOW_NOT_WEBHOOK" }, { status: 409 });
        }
        const expectedToken = typeof ((_b = workflow.trigger.config) === null || _b === void 0 ? void 0 : _b.token) === "string"
            ? workflow.trigger.config.token
            : null;
        if (expectedToken) {
            const provided = req.headers.get("x-webhook-token") ||
                new URL(req.url).searchParams.get("token") ||
                "";
            if (provided !== expectedToken) {
                return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
            }
        }
        const body = (_c = (await readJson(req))) !== null && _c !== void 0 ? _c : {};
        const tenantId = workflow.tenant_id;
        const result = await dispatchCustomWebhook(tenantId, id, body, null);
        await logAudit("automation.api.hooks.invoke", {
            tenantId,
            workflowId: id,
            runId: result.runId,
        });
        if (!result.runId) {
            return NextResponse.json({ error: "FILTER_MISMATCH" }, { status: 422 });
        }
        return ok({ data: { runId: result.runId } });
    }
    catch (err) {
        return serverError(err);
    }
}
