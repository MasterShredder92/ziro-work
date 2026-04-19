/**
 * Queue an export job for a saved or built-in report.
 * POST /reports/api/catalog/[id]/export
 *   body: { format: 'csv'|'xlsx'|'pdf', params?, query? }
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { badRequest, created, readJson, resolveTenantId, serverError } from "@/lib/http";
import { queueReportExport } from "@/lib/reports/exportService";
import type { ExportFormat, ReportQuery } from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Params = { params: Promise<{ id: string }> };

type ExportBody = {
  format?: ExportFormat;
  params?: Record<string, unknown>;
  query?: ReportQuery | null;
};

const ALLOWED: ExportFormat[] = ["csv", "xlsx", "pdf"];

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
    const body = (await readJson<ExportBody>(req)) ?? {};
    const format = body.format;
    if (!format || !ALLOWED.includes(format)) {
      return badRequest("format must be one of csv|xlsx|pdf");
    }

    const job = await queueReportExport(
      tenantId,
      {
        reportId: id,
        format,
        params: body.params ?? null,
        query: body.query ?? null,
      },
      session?.userId ?? null,
    );

    return created({ data: job });
  } catch (err) {
    return serverError(err);
  }
}
