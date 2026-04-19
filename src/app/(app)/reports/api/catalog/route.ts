/**
 * Reports catalog endpoint.
 * GET  /reports/api/catalog -> list saved reports (custom) + built-in summaries
 * POST /reports/api/catalog -> create a saved (custom) report
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, created, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { listReports as listBuiltInReports } from "@/lib/reports/service";
import {
  createSavedReport,
  listSavedReports,
} from "@/lib/reports/savedReports";
import type { SavedReportInput } from "@/lib/reports/types";

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

    const [builtIn, saved] = await Promise.all([
      listBuiltInReports(),
      listSavedReports(tenantId),
    ]);

    await logAudit("reports.catalog.api", {
      tenantId,
      profileId: session?.userId ?? null,
      builtIn: builtIn.length,
      saved: saved.length,
    });

    return ok({ data: { builtIn, saved } });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("reports.write")();
    } catch {
      return forbidden();
    }
    const tenantId = session?.tenantId ?? resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
    }

    const body = await readJson<SavedReportInput>(req);
    if (!body || typeof body.name !== "string" || body.name.trim().length === 0) {
      return badRequest("name is required");
    }

    const result = await createSavedReport(
      tenantId,
      body,
      session?.userId ?? null,
    );
    return created({ data: result });
  } catch (err) {
    return serverError(err);
  }
}
