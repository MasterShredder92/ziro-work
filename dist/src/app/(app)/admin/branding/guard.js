import "server-only";
import { assertTenantAccess, requirePermission, requireRole, } from "@/lib/auth/guards";
import { ADMIN_STAR_SCOPE, hasPermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Branding dashboard (read-only for directors): `admin.branding.read`.
 * Teachers, families, students have no branding permissions.
 */
export async function resolveBrandingDashboardContext(options) {
    var _a;
    const session = await requirePermission("admin.branding.read")();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return {
        session,
        tenantId,
        canWrite: hasPermission(session.role, ADMIN_STAR_SCOPE),
    };
}
/**
 * Theme, domain, email, layout, preview surfaces — tenant `admin` + `admin.*` only.
 */
export async function resolveBrandingAdminSurfaceContext(options) {
    var _a;
    const session = await requireRole("admin")();
    await requirePermission(ADMIN_STAR_SCOPE)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return {
        session,
        tenantId,
        canWrite: true,
    };
}
/** @deprecated Use resolveBrandingDashboardContext or resolveBrandingAdminSurfaceContext */
export async function resolveBrandingContext(options) {
    if (options === null || options === void 0 ? void 0 : options.requireWrite) {
        return resolveBrandingAdminSurfaceContext(options);
    }
    return resolveBrandingDashboardContext(options);
}
