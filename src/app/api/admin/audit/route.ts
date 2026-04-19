import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/http";
import { searchAudit, exportAuditCsv } from "@/lib/admin/audit";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../_context";
import { handleError } from "../_handle";
import type { AuditLogFilter } from "@data/auditLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseFilter(req: NextRequest): AuditLogFilter {
  const url = new URL(req.url);
  const filter: AuditLogFilter = {};
  const event = url.searchParams.get("event");
  const category = url.searchParams.get("category");
  const actorId = url.searchParams.get("actorId");
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const search = url.searchParams.get("search");
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  if (event) filter.event = event;
  if (category) filter.category = category;
  if (actorId) filter.actorId = actorId;
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  if (since) filter.since = since;
  if (until) filter.until = until;
  if (search) filter.search = search;
  if (limit) {
    const n = Number(limit);
    if (Number.isFinite(n) && n > 0) filter.limit = Math.min(n, 1000);
  }
  if (offset) {
    const n = Number(offset);
    if (Number.isFinite(n) && n >= 0) filter.offset = n;
  }
  return filter;
}

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "director");
    requirePermission(session, "admin.audit.read");
    const filter = parseFilter(req);
    const rows = await searchAudit(tenantId, filter);
    const url = new URL(req.url);
    if (url.searchParams.get("format") === "csv") {
      return new NextResponse(exportAuditCsv(rows), {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="audit-${tenantId}.csv"`,
        },
      });
    }
    return ok({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}
