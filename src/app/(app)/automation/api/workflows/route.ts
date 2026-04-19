import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  created,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import {
  createWorkflowForTenant,
} from "@/lib/automation/workflows/service";
import { listWorkflows } from "@/lib/automation/workflows/queries";
import type { AutomationWorkflowInput } from "@/lib/automation/workflows/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("automation.read")();
    } catch {
      return forbidden();
    }
    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const triggerType = url.searchParams.get("triggerType") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;

    const workflows = await listWorkflows(tenantId, {
      status: status as never,
      triggerType: triggerType ?? undefined,
      search: search ?? undefined,
    });

    await logAudit("automation.api.workflows.list", {
      tenantId,
      profileId: session.userId,
      count: workflows.length,
    });
    return ok({ data: workflows });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("automation.write")();
    } catch {
      return forbidden();
    }
    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const body = await readJson<AutomationWorkflowInput>(req);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return badRequest("Workflow 'name' is required.");
    }
    if (!body.trigger || typeof body.trigger.type !== "string") {
      return badRequest("Workflow 'trigger.type' is required.");
    }
    if (!Array.isArray(body.actions)) {
      return badRequest("Workflow 'actions' must be an array.");
    }

    const workflow = await createWorkflowForTenant(tenantId, {
      ...body,
      createdBy: session.userId,
    });

    await logAudit("automation.api.workflows.create", {
      tenantId,
      profileId: session.userId,
      workflowId: workflow.id,
      name: workflow.name,
      triggerType: workflow.trigger?.type,
    });

    return created({ data: workflow });
  } catch (err) {
    return serverError(err);
  }
}
