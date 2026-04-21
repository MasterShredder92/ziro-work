import "server-only";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Content library is available to any role that has content.read. Write
 * operations are limited to teacher/director/admin via content.write.
 * Students and families get read-only access filtered by visibility in the UI.
 */
export async function resolveContentContext(options) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    const requiredScope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "content.write" : "content.read";
    if (!permissions.includes(requiredScope)) {
        throw new Error("FORBIDDEN");
    }
    await requirePermission(requiredScope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return {
        session,
        tenantId,
        canRead: permissions.includes("content.read"),
        canWrite: permissions.includes("content.write"),
    };
}
