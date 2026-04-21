import { NextResponse } from "next/server";
import { notFound, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getLessonSurface } from "@/lib/curriculum";
import { resolveCurriculumContext } from "../../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    var _a, _b, _c;
    try {
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        let ctx;
        try {
            ctx = await resolveCurriculumContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const { id } = await params;
        const surface = await getLessonSurface(id, ctx.tenantId);
        if (!surface)
            return notFound("Lesson not found");
        await logAudit("curriculum.lesson.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            lessonId: id,
            programId: (_c = (_b = surface.program) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}
