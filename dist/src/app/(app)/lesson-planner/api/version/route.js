import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { saveAIDraft } from "@/lib/lessonPlanner";
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
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const body = (await req.json().catch(() => null));
        if (!body || !body.draft || typeof body.draft !== "object") {
            return badRequest("MISSING_DRAFT");
        }
        const draft = body.draft;
        if (typeof draft.title !== "string" ||
            !Array.isArray(draft.objectives) ||
            !Array.isArray(draft.activities) ||
            !Array.isArray(draft.materials)) {
            return badRequest("INVALID_DRAFT");
        }
        let ctx;
        try {
            ctx = await resolveLessonPlannerContext({
                tenantId: (_a = body.tenantId) !== null && _a !== void 0 ? _a : null,
                requireWrite: true,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const surface = await saveAIDraft((_b = body.planId) !== null && _b !== void 0 ? _b : null, draft, {
            tenantId: ctx.tenantId,
            authorId: (_c = ctx.session.userId) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = body.teacherId) !== null && _d !== void 0 ? _d : null,
            programId: (_e = body.programId) !== null && _e !== void 0 ? _e : null,
            unitId: (_f = body.unitId) !== null && _f !== void 0 ? _f : null,
            lessonId: (_g = body.lessonId) !== null && _g !== void 0 ? _g : null,
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
    }
    catch (err) {
        return serverError(err);
    }
}
