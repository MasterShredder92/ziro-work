import { NextRequest, NextResponse } from "next/server";
import { notFound, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { dispatchCustomWebhook } from "@/lib/automation/workflows/triggers";
import { getWorkflow } from "@/lib/automation/workflows/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function resolveWebhookTenant(
  req: NextRequest,
  existingTenant: string | null,
): string {
  if (existingTenant && existingTenant.trim().length > 0) return existingTenant.trim();
  const header = req.headers.get("x-tenant-id");
  if (header && header.trim().length > 0) return header.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get("tenantId");
  if (q && q.trim().length > 0) return q.trim();
  return DEFAULT_TENANT_ID;
}

export async function POST(req: NextRequest, { params }: Ctx) {
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
    if (!workflow) return notFound("Webhook workflow not found.");
    if (workflow.status !== "active") {
      return NextResponse.json(
        { error: "WORKFLOW_INACTIVE" },
        { status: 409 },
      );
    }
    if (workflow.trigger?.type !== "custom.webhook") {
      return NextResponse.json(
        { error: "WORKFLOW_NOT_WEBHOOK" },
        { status: 409 },
      );
    }

    const expectedToken =
      typeof workflow.trigger.config?.token === "string"
        ? workflow.trigger.config.token
        : null;
    if (expectedToken) {
      const provided =
        req.headers.get("x-webhook-token") ||
        new URL(req.url).searchParams.get("token") ||
        "";
      if (provided !== expectedToken) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
    }

    const body = (await readJson<Record<string, unknown>>(req)) ?? {};
    const tenantId = workflow.tenant_id;

    const result = await dispatchCustomWebhook(tenantId, id, body, null);
    await logAudit("automation.api.hooks.invoke", {
      tenantId,
      workflowId: id,
      runId: result.runId,
    });

    if (!result.runId) {
      return NextResponse.json(
        { error: "FILTER_MISMATCH" },
        { status: 422 },
      );
    }
    return ok({ data: { runId: result.runId } });
  } catch (err) {
    return serverError(err);
  }
}
