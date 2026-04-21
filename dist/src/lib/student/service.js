import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getStudentBilling, getStudentLessons, getStudentMessages, getStudentProfile, getStudentSchedule, } from "./queries";
export async function getStudentDashboard(studentId) {
    var _a;
    const student = await getStudentProfile(studentId);
    const tenantId = (_a = student === null || student === void 0 ? void 0 : student["tenant_id"]) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const [schedule, lessons, messages, billing] = await Promise.all([
        getStudentSchedule(studentId, tenantId),
        getStudentLessons(studentId, tenantId),
        getStudentMessages(studentId, tenantId),
        getStudentBilling(studentId, tenantId),
    ]);
    return {
        student,
        schedule,
        lessons,
        messages,
        billing: billing.items,
        billingSummary: billing.summary,
        payments: billing.payments,
        generatedAt: new Date().toISOString(),
    };
}
