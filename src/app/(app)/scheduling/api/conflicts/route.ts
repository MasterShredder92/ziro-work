import { NextRequest, NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { detectConflicts } from "@/lib/scheduling/queries";
import { resolveSchedulingContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function defaultRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantParam = url.searchParams.get("tenantId")?.trim() || null;
    const start = url.searchParams.get("start")?.trim();
    const end = url.searchParams.get("end")?.trim();

    let ctx;
    try {
      ctx = await resolveSchedulingContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    if ((start && !end) || (!start && end)) {
      return badRequest("Provide both start and end, or neither.");
    }

    const range = start && end ? { start, end } : defaultRange();
    const conflicts = await detectConflicts(ctx.tenantId, range);

    await logAudit("scheduling.conflicts.view", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      rangeStart: range.start,
      rangeEnd: range.end,
      total: conflicts.length,
    });

    return ok({
      tenantId: ctx.tenantId,
      range,
      conflicts,
      total: conflicts.length,
    });
  } catch (err) {
    return serverError(err);
  }
}
