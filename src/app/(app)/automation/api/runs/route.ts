import { NextRequest, NextResponse } from "next/server";
import { ok, resolveTenantId, serverError } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listRuns } from "@/lib/automation/workflows/queries";

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
    const workflowId = url.searchParams.get("workflowId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const triggerType = url.searchParams.get("triggerType") ?? undefined;
    const since = url.searchParams.get("since") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    const runs = await listRuns(
      tenantId,
      {
        workflowId: workflowId ?? undefined,
        status: (status as never) ?? undefined,
        triggerType: triggerType ?? undefined,
        since: since ?? undefined,
      },
      {
        limit: Number.isFinite(limit) ? Math.min(limit, 500) : 50,
        offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
      },
    );

    await logAudit("automation.api.runs.list", {
      tenantId,
      profileId: session.userId,
      count: runs.length,
    });
    return ok({ data: runs });
  } catch (err) {
    return serverError(err);
  }
}
