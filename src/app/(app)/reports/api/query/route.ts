/**
 * Run an ad-hoc ReportQuery without persisting it.
 * POST /reports/api/query
 *   body: { query: ReportQuery }
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { badRequest, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { runQuery } from "@/lib/reports/queryEngine";
import type { ReportQuery } from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Body = { query?: ReportQuery };

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
    if (!body.query || typeof body.query !== "object" || !body.query.source) {
      return badRequest("query.source is required");
    }
    const started = Date.now();
    const result = await runQuery(body.query, tenantId);
    await logAudit("reports.query.run", {
      tenantId,
      profileId: session?.userId ?? null,
      source: body.query.source,
      rowCount: result.rows.length,
      durationMs: Date.now() - started,
    });
    return ok({ data: result });
  } catch (err) {
    return serverError(err);
  }
}
