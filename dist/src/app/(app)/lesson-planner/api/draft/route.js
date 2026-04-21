import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { draftLessonPlanAI } from "@/lib/lessonPlanner";
import { resolveLessonPlannerContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
function badRequest(message) {
    return NextResponse.json({ error: message }, { status: 400 });
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const body = (await req.json().catch(() => null));
        if (!body || !body.request || typeof body.request !== "object") {
            return badRequest("MISSING_REQUEST");
        }
        const tenantCandidate = typeof body.request.tenantId === "string"
            ? body.request.tenantId.trim()
            : null;
        let ctx;
        try {
            ctx = await resolveLessonPlannerContext({
                tenantId: tenantCandidate,
                requireWrite: true,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const request = {
            tenantId: ctx.tenantId,
            planId: (_a = body.request.planId) !== null && _a !== void 0 ? _a : null,
            title: body.request.title,
            subject: (_b = body.request.subject) !== null && _b !== void 0 ? _b : null,
            gradeLevel: (_c = body.request.gradeLevel) !== null && _c !== void 0 ? _c : null,
            durationMinutes: (_d = body.request.durationMinutes) !== null && _d !== void 0 ? _d : null,
            programId: (_e = body.request.programId) !== null && _e !== void 0 ? _e : null,
            unitId: (_f = body.request.unitId) !== null && _f !== void 0 ? _f : null,
            lessonId: (_g = body.request.lessonId) !== null && _g !== void 0 ? _g : null,
            teacherId: (_h = body.request.teacherId) !== null && _h !== void 0 ? _h : null,
            standards: Array.isArray(body.request.standards)
                ? body.request.standards.filter((s) => typeof s === "string")
                : [],
            prompt: body.request.prompt,
            focusAreas: Array.isArray(body.request.focusAreas)
                ? body.request.focusAreas.filter((s) => typeof s === "string")
                : [],
            notes: (_j = body.request.notes) !== null && _j !== void 0 ? _j : null,
        };
        const draft = await draftLessonPlanAI(request);
        await logAudit("lessonPlanner.draft", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            planId: (_k = request.planId) !== null && _k !== void 0 ? _k : null,
            subject: (_l = request.subject) !== null && _l !== void 0 ? _l : null,
            source: "api",
        });
        return ok({ data: { draft } });
    }
    catch (err) {
        return serverError(err);
    }
}
