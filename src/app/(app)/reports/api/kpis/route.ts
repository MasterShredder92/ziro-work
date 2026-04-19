/**
 * KPI snapshot endpoint.
 * GET  /reports/api/kpis               -> list KPI definitions
 * POST /reports/api/kpis               -> compute snapshot for given keys + range
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { computeSnapshot, listKpiDefinitions } from "@/lib/reports/kpis";
import type { ReportRange } from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET() {
  try {
    let session;
    try {
      session = await requirePermission("reports.read")();
    } catch {
      return forbidden();
    }
    void session;
    return ok({ data: listKpiDefinitions() });
  } catch (err) {
    return serverError(err);
  }
}

type Body = { keys?: string[]; range?: ReportRange };

export async function POST(req: NextRequest) {
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
    const body = (await readJson<Body>(req)) ?? {};
    const snapshot = await computeSnapshot(tenantId, body.range, body.keys);
    return ok({ data: snapshot });
  } catch (err) {
    return serverError(err);
  }
}
