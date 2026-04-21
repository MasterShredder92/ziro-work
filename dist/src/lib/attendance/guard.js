import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { assertTenantAccess } from "@/lib/auth/guards";
export class AttendanceAuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
/**
 * Resolve the caller's session + tenant, verify role permission, and check tenant access.
 * Mirrors the `resolveContext` + `requirePermission` + `assertTenantAccess` flow.
 */
export async function resolveAttendanceContext(explicitTenantId, scope) {
    const session = await getSession();
    if (!session)
        throw new AttendanceAuthError(401, "UNAUTHENTICATED");
    const permissions = getPermissionsForRole(session.role);
    if (!permissions.includes(scope)) {
        throw new AttendanceAuthError(403, "FORBIDDEN");
    }
    const tenantId = (explicitTenantId && explicitTenantId.trim()) || session.tenantId;
    if (!tenantId)
        throw new AttendanceAuthError(403, "FORBIDDEN");
    await assertTenantAccess(tenantId);
    return { session, tenantId };
}
export function respondAttendanceError(err) {
    if (err instanceof AttendanceAuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Server error";
    if (message === "FORBIDDEN") {
        return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "UNAUTHENTICATED") {
        return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "RECORD_NOT_FOUND" || message === "SESSION_NOT_FOUND") {
        return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
}
