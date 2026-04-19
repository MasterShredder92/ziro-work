/**
 * List export jobs for the tenant. Supports ?reportId= and ?limit=.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { ok, resolveTenantId, serverError } from "@/lib/http";
import { listExportJobs } from "@/lib/reports/exportService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("reports.read")();
    } catch {
      return forbidden();
    }
    const tenantId = session?.tenantId ?? resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
    }
    const url = new URL(req.url);
    const reportId = url.searchParams.get("reportId") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : 50;
    const jobs = await listExportJobs(tenantId, { reportId, limit });
    return ok({ data: jobs });
  } catch (err) {
    return serverError(err);
  }
}
