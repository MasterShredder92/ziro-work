import { NextRequest, NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getSchedulingDashboard } from "@/lib/scheduling/service";
import { resolveSchedulingContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
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

    const range = start && end ? { start, end } : undefined;
    const data = await getSchedulingDashboard(ctx.tenantId, range);

    await logAudit("scheduling.dashboard.view", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      rangeStart: data.range.start,
      rangeEnd: data.range.end,
      blocks: data.blocks.length,
      conflicts: data.conflicts.length,
      source: "api",
    });

    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}
