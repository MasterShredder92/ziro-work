/**
 * Get export job (status + download).
 * GET /reports/api/exports/[jobId]        -> JSON job summary
 * GET /reports/api/exports/[jobId]?download=1 -> binary download
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { notFound, ok, resolveTenantId, serverError } from "@/lib/http";
import { getExportJob } from "@/lib/reports/exportService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Params = { params: Promise<{ jobId: string }> };

export async function GET(req: NextRequest, ctx: Params) {
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

    const { jobId } = await ctx.params;
    const job = await getExportJob(jobId, tenantId);
    if (!job) return notFound("Export job not found");

    const url = new URL(req.url);
    const wantsDownload = url.searchParams.get("download") === "1";

    if (wantsDownload) {
      if (job.status !== "completed" || !job.contentBase64) {
        return NextResponse.json(
          { error: "Export not ready", status: job.status },
          { status: 409 },
        );
      }
      const bytes = Buffer.from(job.contentBase64, "base64");
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": job.contentType,
          "Content-Length": String(bytes.byteLength),
          "Content-Disposition": `attachment; filename="${job.filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const { contentBase64: _omit, ...summary } = job;
    void _omit;
    return ok({ data: summary });
  } catch (err) {
    return serverError(err);
  }
}
