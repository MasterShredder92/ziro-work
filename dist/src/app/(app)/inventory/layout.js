import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { INVENTORY_NAV, InventoryShell } from "./components";
export const dynamic = "force-dynamic";
async function resolveInventorySession() {
    const roles = [
        "director",
        "admin",
        "teacher",
    ];
    for (const role of roles) {
        try {
            const session = await requireRole(role)();
            if (session)
                return session;
        }
        catch (_a) {
            /* try next */
        }
    }
    return null;
}
export default async function InventoryLayout({ children, }) {
    var _a, _b;
    const session = (_a = (await resolveInventorySession())) !== null && _a !== void 0 ? _a : (await getSession());
    const tenantId = (_b = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _b !== void 0 ? _b : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_c) {
            return (_jsxs("div", { className: "mx-auto max-w-lg rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to this tenant's inventory." })] }));
        }
    }
    const allowedNavIds = session
        ? INVENTORY_NAV.filter((item) => !item.scope || can(session.role, item.scope)).map((item) => item.id)
        : INVENTORY_NAV.map((item) => item.id);
    const roleLabel = session
        ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
        : undefined;
    return (_jsx(InventoryShell, { tenantLabel: tenantId, roleLabel: roleLabel, allowedNavIds: allowedNavIds, children: children }));
}
