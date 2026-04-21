import { badRequest, ok, serverError } from "@/lib/http";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { getStudentDashboard } from "@/lib/student/service";
import { getStudentByProfileId, getStudentProfile, } from "@/lib/student/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c;
    try {
        const session = await requireRole("student")();
        const url = new URL(req.url);
        const explicitId = (_b = (_a = url.searchParams.get("studentId")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        let studentId = explicitId;
        let student = null;
        if (studentId) {
            student = await getStudentProfile(studentId);
        }
        else {
            student = await getStudentByProfileId(session.userId);
            if (student)
                studentId = student.id;
        }
        if (!student || !studentId) {
            return badRequest("No student record available for the current session.");
        }
        const tenantId = (_c = student["tenant_id"]) !== null && _c !== void 0 ? _c : "";
        await assertTenantAccess(tenantId);
        if (session.role === "student" &&
            student["profile_id"] &&
            student["profile_id"] !==
                session.userId) {
            return badRequest("Session user cannot access this student record.");
        }
        const data = await getStudentDashboard(studentId);
        return ok({ data });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load student dashboard.";
        if (message === "FORBIDDEN" || message === "UNAUTHENTICATED") {
            return badRequest(message);
        }
        return serverError(err);
    }
}
