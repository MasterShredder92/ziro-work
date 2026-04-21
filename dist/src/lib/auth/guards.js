import { hasPermission } from "./permissions";
import { roleAtLeast } from "./roles";
import { getSession } from "./session";
export function requireRole(required) {
    return async () => {
        const session = await getSession();
        if (!session)
            throw new Error("UNAUTHENTICATED");
        if (!roleAtLeast(session.role, required))
            throw new Error("FORBIDDEN");
        return session;
    };
}
export function requirePermission(scope) {
    return async () => {
        const session = await getSession();
        if (!session)
            throw new Error("UNAUTHENTICATED");
        if (!hasPermission(session.role, scope))
            throw new Error("FORBIDDEN");
        return session;
    };
}
export function assertRole(session, required) {
    if (!session)
        throw new Error("UNAUTHENTICATED");
    if (!roleAtLeast(session.role, required))
        throw new Error("FORBIDDEN");
    return session;
}
export function assertPermission(session, scope) {
    if (!session)
        throw new Error("UNAUTHENTICATED");
    if (!hasPermission(session.role, scope)) {
        throw new Error("FORBIDDEN");
    }
    return session;
}
export async function assertTenantAccess(resourceTenantId) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const expected = (resourceTenantId !== null && resourceTenantId !== void 0 ? resourceTenantId : "").trim();
    if (!expected)
        throw new Error("FORBIDDEN");
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (base === "admin")
        return session;
    if (session.tenantId !== expected)
        throw new Error("FORBIDDEN");
    return session;
}
export function assertTenantMatch(session, tenantId) {
    var _a;
    if (!session)
        throw new Error("UNAUTHENTICATED");
    const expected = (tenantId !== null && tenantId !== void 0 ? tenantId : "").trim();
    if (!expected)
        throw new Error("FORBIDDEN");
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (base === "admin")
        return session;
    if (session.tenantId !== expected)
        throw new Error("FORBIDDEN");
    return session;
}
