import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentAttemptSurface, gradeAttempt, } from "@/lib/assessments";
import { resolveAssessmentsContext } from "../../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        let ctx;
        try {
            ctx = await resolveAssessmentsContext();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const surface = await getAssessmentAttemptSurface(id, ctx.tenantId);
        if (!surface) {
            return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        }
        await logAudit("assessments.attempt.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            attemptId: id,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}
function isNumberRecord(v) {
    return (!!v &&
        typeof v === "object" &&
        Object.values(v).every((x) => typeof x === "number"));
}
function isNestedNumberRecord(v) {
    return (!!v &&
        typeof v === "object" &&
        Object.values(v).every((x) => isNumberRecord(x)));
}
export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const body = (await req.json().catch(() => ({})));
        let ctx;
        try {
            ctx = await resolveAssessmentsContext({ requireWrite: true });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const manualScores = isNumberRecord(body.manualScores)
            ? body.manualScores
            : undefined;
        const rubricScores = isNestedNumberRecord(body.rubricScores)
            ? body.rubricScores
            : undefined;
        const feedback = typeof body.feedback === "string" ? body.feedback : undefined;
        const result = await gradeAttempt(id, ctx.tenantId, {
            manualScores,
            rubricScores,
            feedback,
            gradedBy: ctx.session.userId,
        });
        await logAudit("assessments.attempt.grade", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            attemptId: id,
            assessmentId: result.attempt.assessment_id,
            scorePct: result.score.percent,
            source: "api",
        });
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
