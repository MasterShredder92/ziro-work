import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import {
  deleteWorkflowForTenant,
  updateWorkflowForTenant,
} from "@/lib/automation/workflows/service";
import { getWorkflow } from "@/lib/automation/workflows/queries";
import type { AutomationWorkflowInput } from "@/lib/automation/workflows/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
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
    const workflow = await getWorkflow(id, tenantId);
    if (!workflow) return notFound("Workflow not found.");
    return ok({ data: workflow });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
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

    const body = await readJson<Partial<AutomationWorkflowInput>>(req);
    if (!body) return badRequest("Request body must be JSON.");

    try {
      const workflow = await updateWorkflowForTenant(id, tenantId, body);
      await logAudit("automation.api.workflows.update", {
        tenantId,
        profileId: session.userId,
        workflowId: id,
      });
      return ok({ data: workflow });
    } catch (err) {
      if (err instanceof Error && err.message === "AUTOMATION_WORKFLOW_NOT_FOUND") {
        return notFound("Workflow not found.");
      }
      throw err;
    }
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
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
    await deleteWorkflowForTenant(id, tenantId);
    await logAudit("automation.api.workflows.delete", {
      tenantId,
      profileId: session.userId,
      workflowId: id,
    });
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
