import { resolveTeacherContext } from "../../guard";
import { runTeacherWorkflow } from "@/lib/teacher/orchestrator";
import { logAudit } from "@/lib/audit/log";
import { badRequest, ok, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b;
    try {
        const url = new URL(req.url);
        const explicit = (_b = (_a = url.searchParams.get("teacherId")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        const ctx = await resolveTeacherContext({
            teacherId: explicit.length > 0 ? explicit : null,
        });
        await logAudit("teacher.workflow.start", {
            teacherId: ctx.teacherId,
            tenantId: ctx.tenantId,
            userId: ctx.session.userId,
        });
        const result = await runTeacherWorkflow(ctx.teacherId, {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
        });
        await logAudit("teacher.workflow.finish", {
            teacherId: ctx.teacherId,
            tenantId: ctx.tenantId,
            ok: result.ok,
            steps: result.steps.map((s) => ({ step: s.step, status: s.status })),
        });
        return ok({ data: result });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message === "FORBIDDEN") {
                return badRequest("Forbidden");
            }
            if (err.message === "TEACHER_NOT_FOUND") {
                return badRequest("No teacher record found for this session.");
            }
        }
        return serverError(err);
    }
}
