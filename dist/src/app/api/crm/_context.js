import { NextResponse } from "next/server";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import { resolveTenantIdFromRequest } from "@/lib/http";
/**
 * Combined guard for all /api/crm/* routes:
 *  - resolveContext (session + tenant)
 *  - requireRole (must be at least the provided role)
 *  - requirePermission (one of the given scopes)
 *  - assertTenantAccess (session.tenantId must match request tenant
 *    unless the caller is a platform admin)
 */
export async function resolveCRMContext(req, opts) {
    var _a, _b;
    const session = await getSession();
    if (!session) {
        return {
            response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
        };
    }
    const minRole = (_a = opts.minRole) !== null && _a !== void 0 ? _a : "teacher";
    if (!roleAtLeast(session.role, minRole)) {
        return {
            response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
        };
    }
    const scopes = getPermissionsForRole(session.role);
    const hasScope = opts.permissions.some((p) => scopes.includes(p));
    if (!hasScope) {
        return {
            response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
        };
    }
    const tenantId = await resolveTenantIdFromRequest(req);
    const base = (_b = session.baseRole) !== null && _b !== void 0 ? _b : session.role;
    if (base !== "admin" && session.tenantId !== tenantId) {
        return {
            response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
        };
    }
    return { context: { session, tenantId } };
}
