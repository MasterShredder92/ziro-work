import { NextRequest, NextResponse } from "next/server";
import { notFound, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getProgramSurface } from "@/lib/curriculum";
import { resolveCurriculumContext } from "../../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const surface = await getProgramSurface(id, ctx.tenantId);
    if (!surface) return notFound("Program not found");

    await logAudit("curriculum.program.view", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      programId: id,
      source: "api",
    });

    return ok({ data: surface });
  } catch (err) {
    return serverError(err);
  }
}
