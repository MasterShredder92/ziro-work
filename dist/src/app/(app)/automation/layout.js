import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { canForRole } from "@/lib/auth/permissions";
import { AutomationShell } from "./components/AutomationShell";
export default async function AutomationLayout({ children, }) {
    var _a;
    const session = await getSession();
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (!session) {
        return (_jsxs("div", { className: "p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Sign in to view Automation OS." })] }));
    }
    if (!canForRole(session.role, "automation.read")) {
        return (_jsxs("div", { className: "p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Your role does not have automation.read permission." })] }));
    }
    return (_jsx(AutomationShell, { tenantId: tenantId, children: children }));
}
