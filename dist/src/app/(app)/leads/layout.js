import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { LEADS_NAV, LeadsShell } from "./components";
export const dynamic = "force-dynamic";
async function resolveLeadsSession() {
    let session = null;
    try {
        session = await requireRole("director")();
        return session;
    }
    catch (_a) {
        try {
            session = await requireRole("admin")();
            return session;
        }
        catch (_b) {
            return null;
        }
    }
}
export default async function LeadsLayout({ children, }) {
    var _a;
    const session = await resolveLeadsSession();
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_b) {
            return (_jsxs("div", { className: "mx-auto max-w-lg rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to this tenant's leads." })] }));
        }
    }
    const allowedNavIds = session
        ? LEADS_NAV.filter((item) => !item.scope || can(session.role, item.scope)).map((item) => item.id)
        : LEADS_NAV.map((item) => item.id);
    const roleLabel = session
        ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
        : undefined;
    return (_jsx(LeadsShell, { tenantId: tenantId, roleLabel: roleLabel, allowedNavIds: allowedNavIds, children: children }));
}
