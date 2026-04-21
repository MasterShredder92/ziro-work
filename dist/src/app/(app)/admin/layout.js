import { jsx as _jsx } from "react/jsx-runtime";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listAdminLocations, listAdminTenants } from "@/lib/admin/tenants";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { ADMIN_NAV_ITEMS, AdminShell } from "./_nav";
import { RoleSwitcher } from "./components/RoleSwitcher";
async function resolveAdminTenantId() {
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader && fromHeader.trim().length > 0)
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
export default async function AdminLayout({ children, }) {
    var _a, _b;
    const tenantId = await resolveAdminTenantId();
    const [tenants, locations, session] = await Promise.all([
        listAdminTenants(),
        listAdminLocations(tenantId),
        getSession(),
    ]);
    const tenantOptions = tenants.length > 0 ? tenants : [{ id: tenantId, name: "Default tenant" }];
    const allowedNavHrefs = session
        ? ADMIN_NAV_ITEMS.filter((item) => !item.scope || can(session.role, item.scope)).map((item) => item.href)
        : ADMIN_NAV_ITEMS.map((item) => item.href);
    const baseRole = (_b = (_a = session === null || session === void 0 ? void 0 : session.baseRole) !== null && _a !== void 0 ? _a : session === null || session === void 0 ? void 0 : session.role) !== null && _b !== void 0 ? _b : null;
    const headerExtras = session && (baseRole === "admin" || baseRole === "director") ? (_jsx(RoleSwitcher, { baseRole: baseRole, currentRole: session.role, isImpersonating: !!session.isImpersonating })) : null;
    return (_jsx(AdminShell, { tenantId: tenantId, tenants: tenantOptions, locations: locations, allowedNavHrefs: allowedNavHrefs, headerExtras: headerExtras, children: children }));
}
