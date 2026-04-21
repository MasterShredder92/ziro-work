import "server-only";
import { NextResponse } from "next/server";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Resolves the current caller's content context for any `/api/content/*`
 * endpoint. Enforces resolveContext → requireRole → requirePermission →
 * assertTenantAccess in that order, matching other ZiroWork APIs.
 */
export async function resolveContentApiContext(req, options) {
    var _a, _b;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const scope = (options === null || options === void 0 ? void 0 : options.requireWrite) ? "content.write" : "content.read";
    await requirePermission(scope)();
    const url = new URL(req.url);
    const headerTenant = ((_a = req.headers.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    const queryTenant = ((_b = url.searchParams.get("tenantId")) === null || _b === void 0 ? void 0 : _b.trim()) || null;
    const tenantId = headerTenant || queryTenant || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const permissions = getPermissionsForRole(session.role);
    return {
        session,
        tenantId,
        canRead: permissions.includes("content.read"),
        canWrite: permissions.includes("content.write"),
    };
}
export function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export function unauthorized(message = "UNAUTHENTICATED") {
    return NextResponse.json({ error: message }, { status: 401 });
}
export function toAuthErrorResponse(err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "UNAUTHENTICATED")
        return unauthorized(message);
    if (message === "FORBIDDEN" ||
        message === "INSUFFICIENT_PERMISSIONS" ||
        message === "TENANT_FORBIDDEN" ||
        message.startsWith("ROLE_")) {
        return forbidden(message);
    }
    return null;
}
