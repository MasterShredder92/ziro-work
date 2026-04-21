import "server-only";
import { assertTenantAccess, requirePermission, requireRole, } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export async function resolveSchedulingContext(options) {
    var _a;
    const session = await requireRole("director")();
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "scheduling.write" : "scheduling.read";
    await requirePermission(scope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) ||
        session.tenantId ||
        DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    return { session, tenantId };
}
