import "server-only";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Lesson Planner is available to teacher, director, and admin roles.
 * Student and family roles have no access. Both read and write scopes are
 * granted to teacher/director/admin; the `canWrite` flag remains for future
 * UI gating.
 */
export async function resolveLessonPlannerContext(options) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite)
        ? "lessonPlanner.write"
        : "lessonPlanner.read";
    if (!permissions.includes(scope)) {
        throw new Error("FORBIDDEN");
    }
    await requirePermission(scope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return {
        session,
        tenantId,
        canWrite: permissions.includes("lessonPlanner.write"),
    };
}
