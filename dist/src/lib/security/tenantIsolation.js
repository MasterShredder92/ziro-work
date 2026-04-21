import "server-only";
import { AppError } from "@/lib/errors/AppError";
export function assertTenantScoped(session, resourceTenantId) {
    var _a;
    if (!session)
        throw AppError.unauthenticated();
    const expected = (resourceTenantId !== null && resourceTenantId !== void 0 ? resourceTenantId : "").trim();
    if (!expected)
        throw AppError.forbidden("Resource has no tenant context");
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (base !== "admin" && session.tenantId !== expected) {
        throw new AppError({
            code: "FORBIDDEN",
            message: "Cross-tenant access blocked",
            details: { sessionTenantId: session.tenantId, resourceTenantId: expected },
        });
    }
    return { session, tenantId: expected };
}
export function filterByTenant(rows, session) {
    var _a;
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (base === "admin")
        return rows;
    return rows.filter((r) => {
        var _a, _b;
        const rowTenant = ((_b = (_a = r.tenant_id) !== null && _a !== void 0 ? _a : r.tenantId) !== null && _b !== void 0 ? _b : "");
        return rowTenant === session.tenantId;
    });
}
