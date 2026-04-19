import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { saveAIDraft } from "@/lib/lessonPlanner";
import type { AIDraftResult } from "@/lib/lessonPlanner/types";
import { resolveLessonPlannerContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

type VersionPostBody = {
  planId?: string | null;
  draft?: AIDraftResult;
  tenantId?: string | null;
  teacherId?: string | null;
  programId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as VersionPostBody | null;

    if (!body || !body.draft || typeof body.draft !== "object") {
      return badRequest("MISSING_DRAFT");
    }

    const draft = body.draft as AIDraftResult;
    if (
      typeof draft.title !== "string" ||
      !Array.isArray(draft.objectives) ||
      !Array.isArray(draft.activities) ||
      !Array.isArray(draft.materials)
    ) {
      return badRequest("INVALID_DRAFT");
    }

    let ctx;
    try {
      ctx = await resolveLessonPlannerContext({
        tenantId: body.tenantId ?? null,
        requireWrite: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const surface = await saveAIDraft(body.planId ?? null, draft, {
      tenantId: ctx.tenantId,
      authorId: ctx.session.userId ?? null,
      teacherId: body.teacherId ?? null,
      programId: body.programId ?? null,
      unitId: body.unitId ?? null,
      lessonId: body.lessonId ?? null,
    });

    await logAudit("lessonPlanner.version.save", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      planId: surface.plan.id,
      version: surface.plan.current_version,
      source: "api",
    });

    return ok({ data: surface });
  } catch (err) {
    return serverError(err);
  }
}
