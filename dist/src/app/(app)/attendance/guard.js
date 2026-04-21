import "server-only";
import { assertTenantAccess, requirePermission, requireRole, } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export async function resolveAttendancePageContext(options) {
    var _a;
    const session = await requireRole("teacher")();
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "attendance.write" : "attendance.read";
    await requirePermission(scope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return { session, tenantId };
}
