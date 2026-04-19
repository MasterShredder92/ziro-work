import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  notFound,
  ok,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadById } from "@/lib/leads/queries";
import { runLeadWorkflow } from "@/lib/leads/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("leads.write")();
    } catch {
      return forbidden();
    }

    const url = new URL(req.url);
    const leadId = url.searchParams.get("leadId");
    if (!leadId || leadId.trim().length === 0) {
      return badRequest("Missing leadId");
    }

    const tenantId = session.tenantId ?? resolveTenantId(req);

    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const lead = await getLeadById(leadId, tenantId);
    if (!lead) return notFound("Lead not found");

    try {
      await assertTenantAccess(lead.tenant_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const workflow = await runLeadWorkflow(leadId, {
      tenantId: lead.tenant_id,
      profileId: session.userId,
    });

    await logAudit("leads.workflow.run", {
      tenantId: lead.tenant_id,
      leadId,
      profileId: session.userId,
      ok: workflow.ok,
      durationMs: workflow.durationMs,
      promoted: workflow.promoted,
      qualificationTier: workflow.qualificationTier,
      steps: workflow.steps.map((s) => ({
        step: s.step,
        status: s.status,
        durationMs: s.result?.durationMs ?? 0,
      })),
    });

    return ok({ data: workflow });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return forbidden();
    }
    return serverError(err);
  }
}
