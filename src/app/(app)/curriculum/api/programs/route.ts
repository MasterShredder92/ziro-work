import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getCurriculumDashboard } from "@/lib/curriculum";
import { resolveCurriculumContext } from "../../guard";

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
      ctx = await resolveCurriculumContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const data = await getCurriculumDashboard(ctx.tenantId);

    await logAudit("curriculum.programs.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      programs: data.kpis.totalPrograms,
      source: "api",
    });

    return ok({
      data: {
        tenantId: data.tenantId,
        generatedAt: data.generatedAt,
        kpis: data.kpis,
        programs: data.tree.programs.map((p) => p.program),
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
