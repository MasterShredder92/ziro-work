import "server-only";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Assessments are available to any role that has assessments.read. Write
 * and grading are limited to teacher/director/admin via assessments.write.
 * Students and families can still access runner pages because they have
 * assessments.read + assessments.run in their permission set.
 */
export async function resolveAssessmentsContext(options) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    const requiredScope = (options === null || options === void 0 ? void 0 : options.requireWrite)
        ? "assessments.write"
        : (options === null || options === void 0 ? void 0 : options.requireRun)
            ? "assessments.run"
            : "assessments.read";
    if (!permissions.includes(requiredScope)) {
        throw new Error("FORBIDDEN");
    }
    await requirePermission(requiredScope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return {
        session,
        tenantId,
        canWrite: permissions.includes("assessments.write"),
        canRun: permissions.includes("assessments.run"),
        canGrade: permissions.includes("assessments.write"),
    };
}
