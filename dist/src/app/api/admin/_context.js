import "server-only";
import { getSession } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";
import { resolveTenantIdFromRequest } from "@/lib/http";
export class AdminApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
export async function resolveContext(req) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new AdminApiError("UNAUTHENTICATED", 401);
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId)
        throw new AdminApiError("TENANT_REQUIRED", 400);
    const baseRole = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (baseRole !== "admin" && session.tenantId !== tenantId) {
        throw new AdminApiError("FORBIDDEN", 403);
    }
    return { session, tenantId };
}
export function requireRole(session, required) {
    if (!roleAtLeast(session.role, required)) {
        throw new AdminApiError("FORBIDDEN", 403);
    }
}
export function requirePermission(session, permission) {
    if (!hasPermission(session.role, permission)) {
        throw new AdminApiError("FORBIDDEN", 403);
    }
}
