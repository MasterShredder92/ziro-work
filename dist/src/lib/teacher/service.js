import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getTeacherLessons, getTeacherMessages, getTeacherProfile, getTeacherSchedule, getTeacherStudents, } from "./queries";
export async function getTeacherDashboard(teacherId) {
    var _a;
    const teacher = await getTeacherProfile(teacherId);
    const tenantId = (_a = teacher === null || teacher === void 0 ? void 0 : teacher.tenant_id) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const [schedule, students, lessons, messages] = await Promise.all([
        getTeacherSchedule(teacherId, tenantId),
        getTeacherStudents(teacherId, tenantId),
        getTeacherLessons(teacherId, tenantId),
        getTeacherMessages(teacherId, tenantId),
    ]);
    return { teacher, schedule, students, lessons, messages };
}
