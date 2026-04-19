import { NextRequest, NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
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
    const skillParam = url.searchParams.get("skill")?.trim() ?? "";

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

    let automation: unknown = null;
    if (skillParam.length > 0) {
      const result = await invokeSkill(skillParam, {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        extra: {
          scope: "scheduling",
          rangeStart: data.range.start,
          rangeEnd: data.range.end,
        },
      });
      automation = result;
      await logAudit("scheduling.skill.invoke", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        skillId: skillParam,
        ok: result.ok,
        durationMs: result.durationMs,
      });
    }

    return ok({ data, automation });
  } catch (err) {
    return serverError(err);
  }
}
