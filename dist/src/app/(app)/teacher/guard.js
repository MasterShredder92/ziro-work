import "server-only";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { getTeacherByProfileId, getTeacherProfile } from "@/lib/teacher/queries";
export async function ensureTeacherAccess() {
    return requireRole("teacher")();
}
export async function resolveTeacherContext(options) {
    var _a, _b;
    const session = await requireRole("teacher")();
    let teacher = null;
    const explicitId = (_a = options === null || options === void 0 ? void 0 : options.teacherId) === null || _a === void 0 ? void 0 : _a.trim();
    if (explicitId) {
        teacher = await getTeacherProfile(explicitId);
    }
    else {
        teacher = await getTeacherByProfileId(session.userId);
        if (!teacher)
            teacher = await getTeacherProfile(session.userId);
    }
    if (!teacher) {
        throw new Error("TEACHER_NOT_FOUND");
    }
    const teacherTenant = (_b = teacher.tenant_id) !== null && _b !== void 0 ? _b : "";
    await assertTenantAccess(teacherTenant);
    if (session.role === "teacher" &&
        teacher.profile_id &&
        teacher.profile_id !== session.userId) {
        throw new Error("FORBIDDEN");
    }
    return {
        session,
        teacher,
        teacherId: teacher.id,
        tenantId: teacherTenant,
    };
}
