import "server-only";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export async function resolveScheduleContext(options) {
    var _a;
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "schedule.write" : "schedule.read";
    const session = await requirePermission(scope)();
    const tenantId = ((_a = options === null || options === void 0 ? void 0 : options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const canWrite = ["admin", "director", "teacher"].includes(session.role);
    return { session, tenantId, canWrite };
}
