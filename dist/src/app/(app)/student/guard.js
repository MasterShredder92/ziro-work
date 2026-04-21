import "server-only";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { getStudentByProfileId, getStudentProfile, } from "@/lib/student/queries";
export async function ensureStudentAccess() {
    return requireRole("student")();
}
export async function resolveStudentContext(options) {
    var _a, _b;
    const session = await requireRole("student")();
    let student = null;
    const explicitId = (_a = options === null || options === void 0 ? void 0 : options.studentId) === null || _a === void 0 ? void 0 : _a.trim();
    if (explicitId) {
        student = await getStudentProfile(explicitId);
    }
    else {
        student = await getStudentByProfileId(session.userId);
    }
    if (!student) {
        throw new Error("STUDENT_NOT_FOUND");
    }
    const studentTenant = (_b = student["tenant_id"]) !== null && _b !== void 0 ? _b : "";
    await assertTenantAccess(studentTenant);
    if (session.role === "student" &&
        student["profile_id"] &&
        student["profile_id"] !==
            session.userId) {
        throw new Error("FORBIDDEN");
    }
    return {
        session,
        student,
        studentId: student.id,
        tenantId: studentTenant,
    };
}
