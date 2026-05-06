import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  ok,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listLocations, getDirectorLocation } from "@/lib/director/queries";
import { getDirectorDashboard } from "@/lib/director/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requireRole("director")();
    } catch {
      session = null;
    }

    const tenantId = session?.tenantId ?? resolveTenantId(req);

    const url = new URL(req.url);
    let locationId = url.searchParams.get("locationId");
    if (!locationId || locationId.trim().length === 0) {
      const locations = await listLocations(tenantId);
      locationId = locations[0]?.id ?? null;
    }
    if (!locationId) {
      return badRequest("No location available for this tenant.");
    }

    const location = await getDirectorLocation(tenantId, locationId);

    try {
      await assertTenantAccess(location.tenant_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const data = await getDirectorDashboard(location.id, location.tenant_id);

    await logAudit("director.dashboard.view", {
      locationId: location.id,
      tenantId: location.tenant_id,
      profileId: session?.userId ?? null,
      generatedAt: data.generatedAt,
    });

    return ok({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return forbidden();
    }
    return serverError(err);
  }
}
