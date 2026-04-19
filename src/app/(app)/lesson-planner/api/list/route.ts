import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getLessonPlannerDashboard } from "@/lib/lessonPlanner";
import { resolveLessonPlannerContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantParam = url.searchParams.get("tenantId")?.trim() || null;

    let ctx;
    try {
      ctx = await resolveLessonPlannerContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const data = await getLessonPlannerDashboard(ctx.tenantId);

    await logAudit("lessonPlanner.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      total: data.kpis.totalPlans,
      source: "api",
    });

    return ok({
      data: {
        tenantId: data.tenantId,
        generatedAt: data.generatedAt,
        kpis: data.kpis,
        plans: data.plans,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
