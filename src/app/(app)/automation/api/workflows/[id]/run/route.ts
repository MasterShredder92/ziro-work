import { NextRequest, NextResponse } from "next/server";
import {
  notFound,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { runWorkflowManually } from "@/lib/automation/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
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

    const body = await readJson<{ payload?: Record<string, unknown> }>(req);

    try {
      const run = await runWorkflowManually(id, tenantId, {
        payload: body?.payload ?? {},
        triggeredBy: session.userId,
      });
      await logAudit("automation.api.workflows.run", {
        tenantId,
        profileId: session.userId,
        workflowId: id,
        runId: run.id,
      });
      return ok({ data: run });
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
