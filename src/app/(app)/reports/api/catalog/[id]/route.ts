/**
 * Saved report by id.
 * GET    -> report + widgets
 * PATCH  -> update metadata / query / widgets
 * DELETE -> archive / remove
 */

import { NextRequest, NextResponse } from "next/server";

import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { noContent, notFound, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import {
  deleteSavedReport,
  getSavedReport,
  updateSavedReport,
} from "@/lib/reports/savedReports";
import type { SavedReportInput } from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Params = { params: Promise<{ id: string }> };

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
    const { id } = await ctx.params;
    const result = await getSavedReport(id, tenantId);
    if (!result) return notFound("Report not found");
    return ok({ data: result });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Params) {
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
    const { id } = await ctx.params;
    const body = (await readJson<Partial<SavedReportInput>>(req)) ?? {};
    const result = await updateSavedReport(
      id,
      tenantId,
      body as SavedReportInput,
      session?.userId ?? null,
    );
    if (!result) return notFound("Report not found");
    return ok({ data: result });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Params) {
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
    const { id } = await ctx.params;
    const okDelete = await deleteSavedReport(id, tenantId, session?.userId ?? null);
    if (!okDelete) return notFound("Report not found");
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
