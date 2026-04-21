import "server-only";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Curriculum access is role-gated: admin, director, and teacher can read.
 * Only admin and director can write. This guard resolves the active tenant
 * from the session (or an explicit override) and enforces tenant access.
 */
export async function resolveCurriculumContext(options) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "curriculum.write" : "curriculum.read";
    if (!permissions.includes(scope)) {
        throw new Error("FORBIDDEN");
    }
    await requirePermission(scope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const canWrite = permissions.includes("curriculum.write");
    return { session, tenantId, canWrite };
}
