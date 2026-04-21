import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/log";
import { ok, serverError } from "@/lib/http";
import { getProgressSurface } from "@/lib/progress/service";
import { resolveProgressContext } from "../../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
function badRequest(message) {
    return NextResponse.json({ error: message }, { status: 400 });
}
export async function GET(req, context) {
    var _a;
    try {
        const { id } = await context.params;
        const studentId = (id !== null && id !== void 0 ? id : "").trim();
        if (!studentId)
            return badRequest("studentId is required.");
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) !== null && _a !== void 0 ? _a : "").trim();
        let ctx;
        try {
            ctx = await resolveProgressContext({
                tenantId: tenantParam || null,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        let surface;
        try {
            surface = await getProgressSurface(studentId, ctx.tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "NOT_FOUND";
            if (message === "FORBIDDEN")
                return forbidden(message);
            return NextResponse.json({ error: message }, { status: 404 });
        }
        await logAudit("progress.api.student.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            studentId,
            goals: surface.goals.length,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}
