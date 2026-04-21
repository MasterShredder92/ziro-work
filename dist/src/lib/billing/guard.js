import "server-only";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { assertTenantAccess } from "@/lib/auth/guards";
import { resolveTenantIdBySlugOrId } from "@/lib/http";
export class BillingAuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
/**
 * Resolve a billing request context: session + tenant + permission check.
 *
 * Usage mirrors an abstract `resolveContext` + `requirePermission` +
 * `assertTenantAccess` flow.
 */
export async function resolveBillingContext(explicitTenantId, scope) {
    const session = await getSession();
    if (!session)
        throw new BillingAuthError(401, "UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    if (!permissions.includes(scope)) {
        throw new BillingAuthError(403, "FORBIDDEN");
    }
    const resolvedFromHint = await resolveTenantIdBySlugOrId(explicitTenantId);
    const tenantId = resolvedFromHint || session.tenantId;
    if (!tenantId)
        throw new BillingAuthError(403, "FORBIDDEN");
    await assertTenantAccess(tenantId);
    return { session, tenantId };
}
export function httpErrorFromBilling(err) {
    if (err instanceof BillingAuthError) {
        return { status: err.status, message: err.message };
    }
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Server error";
    if (message === "FORBIDDEN")
        return { status: 403, message };
    if (message === "UNAUTHENTICATED")
        return { status: 401, message };
    return { status: 500, message };
}
