import { NextRequest, NextResponse } from "next/server";
import {
  ok,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadDashboard } from "@/lib/leads/service";
import type { LeadFilters } from "@/lib/leads/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function parseFilters(url: URL): LeadFilters {
  const filters: LeadFilters = {};
  const stage = url.searchParams.get("stage");
  const source = url.searchParams.get("source");
  const assignedTo = url.searchParams.get("assignedTo");
  const locationId = url.searchParams.get("locationId");
  const search = url.searchParams.get("q");
  if (stage) filters.stage = stage;
  if (source) filters.source = source;
  if (assignedTo) filters.assignedTo = assignedTo;
  if (locationId) filters.locationId = locationId;
  if (search) filters.search = search;
  return filters;
}

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("leads.read")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId ?? resolveTenantId(req);

    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const url = new URL(req.url);
    const filters = parseFilters(url);

    const data = await getLeadDashboard(tenantId, filters);

    await logAudit("leads.dashboard.view", {
      tenantId,
      profileId: session.userId,
      filters,
      generatedAt: data.generatedAt,
      source: "api",
    });

    return ok({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return forbidden();
    }
    return serverError(err);
  }
}
