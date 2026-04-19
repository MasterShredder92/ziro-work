/**
 * Run a saved report by id (or ad-hoc query).
 * POST /reports/api/catalog/[id]/run
 *   body: { params?: Record, query?: ReportQuery }
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { badRequest, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getSavedReport } from "@/lib/reports/savedReports";
import { runQuery } from "@/lib/reports/queryEngine";
import { runReport } from "@/lib/reports/service";
import type { ReportQuery } from "@/lib/reports/types";
import { listReportDefinitions } from "@/lib/reports/definitions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Params = { params: Promise<{ id: string }> };

type RunBody = {
  params?: Record<string, unknown>;
  query?: ReportQuery;
};

export async function POST(req: NextRequest, ctx: Params) {
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
    const { id } = await ctx.params;
    const body = (await readJson<RunBody>(req)) ?? {};

    const builtInIds = new Set(listReportDefinitions().map((d) => d.id));
    if (builtInIds.has(id as never)) {
      const outcome = await runReport(id, body.params ?? {}, {
        tenantId,
        profileId: session?.userId ?? null,
        role: session?.role ?? null,
      });
      if (!outcome.ok) {
        const code = outcome.error?.code ?? "ERROR";
        const message = outcome.error?.message ?? "Report run failed";
        if (code === "FORBIDDEN") return forbidden(message);
        if (code === "NOT_FOUND")
          return NextResponse.json({ error: message }, { status: 404 });
        return NextResponse.json(
          { error: message, execution: outcome.execution },
          { status: 400 },
        );
      }
      return ok({ data: outcome.result, execution: outcome.execution });
    }

    const saved = await getSavedReport(id, tenantId);
    if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const q = body.query ?? saved.report.query;
    if (!q) return badRequest("Report has no query and no query was supplied");

    const started = Date.now();
    const result = await runQuery(q, tenantId);
    await logAudit("reports.run.saved", {
      tenantId,
      profileId: session?.userId ?? null,
      reportId: id,
      rowCount: result.rows.length,
      durationMs: Date.now() - started,
    });
    return ok({ data: { ...saved, result } });
  } catch (err) {
    return serverError(err);
  }
}
