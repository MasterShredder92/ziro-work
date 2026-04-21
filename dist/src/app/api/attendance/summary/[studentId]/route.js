import { ok, resolveTenantId } from "@/lib/http";
import { resolveAttendanceContext, respondAttendanceError, } from "@/lib/attendance/guard";
import { getStudentAttendanceSummary } from "@/lib/attendance/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    var _a, _b;
    try {
        const { studentId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
        const url = new URL(req.url);
        const start = (_a = url.searchParams.get("start")) !== null && _a !== void 0 ? _a : undefined;
        const end = (_b = url.searchParams.get("end")) !== null && _b !== void 0 ? _b : undefined;
        const range = start && end ? { start, end } : undefined;
        const data = await getStudentAttendanceSummary(studentId, tenantId, range);
        return ok({ data });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
