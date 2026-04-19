import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { draftLessonPlanAI } from "@/lib/lessonPlanner";
import type { AIDraftRequest } from "@/lib/lessonPlanner/types";
import { resolveLessonPlannerContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      request?: Partial<AIDraftRequest> & { tenantId?: string };
    } | null;

    if (!body || !body.request || typeof body.request !== "object") {
      return badRequest("MISSING_REQUEST");
    }

    const tenantCandidate =
      typeof body.request.tenantId === "string"
        ? body.request.tenantId.trim()
        : null;

    let ctx;
    try {
      ctx = await resolveLessonPlannerContext({
        tenantId: tenantCandidate,
        requireWrite: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const request: AIDraftRequest = {
      tenantId: ctx.tenantId,
      planId: body.request.planId ?? null,
      title: body.request.title,
      subject: body.request.subject ?? null,
      gradeLevel: body.request.gradeLevel ?? null,
      durationMinutes: body.request.durationMinutes ?? null,
      programId: body.request.programId ?? null,
      unitId: body.request.unitId ?? null,
      lessonId: body.request.lessonId ?? null,
      teacherId: body.request.teacherId ?? null,
      standards: Array.isArray(body.request.standards)
        ? body.request.standards.filter((s): s is string => typeof s === "string")
        : [],
      prompt: body.request.prompt,
      focusAreas: Array.isArray(body.request.focusAreas)
        ? body.request.focusAreas.filter((s): s is string => typeof s === "string")
        : [],
      notes: body.request.notes ?? null,
    };

    const draft = await draftLessonPlanAI(request);

    await logAudit("lessonPlanner.draft", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      planId: request.planId ?? null,
      subject: request.subject ?? null,
      source: "api",
    });

    return ok({ data: { draft } });
  } catch (err) {
    return serverError(err);
  }
}
