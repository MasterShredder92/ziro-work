import { getTeacherDashboard } from "@/lib/teacher/service";
import { resolveTeacherContext } from "../../guard";
import { logAudit } from "@/lib/audit/log";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { badRequest, ok, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d;
    try {
        const url = new URL(req.url);
        const explicit = (_b = (_a = url.searchParams.get("teacherId")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        const skillId = (_d = (_c = url.searchParams.get("skill")) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
        const ctx = await resolveTeacherContext({
            teacherId: explicit.length > 0 ? explicit : null,
        });
        const data = await getTeacherDashboard(ctx.teacherId);
        await logAudit("teacher.dashboard.view", {
            teacherId: ctx.teacherId,
            tenantId: ctx.tenantId,
            userId: ctx.session.userId,
            role: ctx.session.role,
        });
        let automation = null;
        if (skillId.length > 0) {
            const result = await invokeSkill(skillId, {
                tenantId: ctx.tenantId,
                profileId: ctx.session.userId,
                extra: { teacherId: ctx.teacherId },
            });
            automation = result;
            await logAudit("teacher.dashboard.automation", {
                teacherId: ctx.teacherId,
                tenantId: ctx.tenantId,
                skillId,
                ok: result.ok,
            });
        }
        return ok({ data, automation });
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
