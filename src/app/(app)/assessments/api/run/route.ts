import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { submitAssessmentAttempt } from "@/lib/assessments";
import type { AssessmentAnswer } from "@/lib/assessments/types";
import { resolveAssessmentsContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function isAnswerArray(value: unknown): value is AssessmentAnswer[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof (a as { question_id?: unknown }).question_id === "string",
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const assessmentId =
      typeof body.assessmentId === "string" ? body.assessmentId : null;
    const answers = isAnswerArray(body.answers) ? body.answers : null;
    const bodyStudentId =
      typeof body.studentId === "string" ? body.studentId : null;
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : null;
    const durationSeconds =
      typeof body.durationSeconds === "number" ? body.durationSeconds : null;

    if (!assessmentId || !answers) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    let ctx;
    try {
      ctx = await resolveAssessmentsContext({ requireRun: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const isStaff = ctx.canGrade;
    const studentId = isStaff && bodyStudentId ? bodyStudentId : ctx.session.userId;

    const { attempt, score } = await submitAssessmentAttempt(
      assessmentId,
      answers,
      {
        tenantId: ctx.tenantId,
        studentId,
        teacherId: isStaff ? ctx.session.userId : null,
        attemptId,
        durationSeconds,
      },
    );

    await logAudit("assessments.run.submit", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      assessmentId,
      attemptId: attempt.id,
      status: attempt.status,
      scorePct: score.percent,
      source: "api",
    });

    return ok({ data: { attempt, score } });
  } catch (err) {
    return serverError(err);
  }
}
