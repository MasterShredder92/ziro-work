import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getAutomationRule } from "@/lib/automation/queries";
import { AutomationEditor } from "../components/AutomationEditor";
export const dynamic = "force-dynamic";
export default async function AutomationRulePage({ params, }) {
    var _a;
    let session = null;
    try {
        session = await requireRole("director")();
    }
    catch (_b) {
        try {
            session = await requireRole("admin")();
        }
        catch (_c) {
            session = null;
        }
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (!session || !canForRole(session.role, "automation.read")) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view this rule." })] }));
    }
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_d) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Tenant access denied." })] }));
    }
    const { id } = await params;
    if (id === "new") {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { href: "/automation", className: "inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to rules" }), _jsx(AutomationEditor, { tenantId: tenantId, rule: null })] }));
    }
    const rule = await getAutomationRule(id, tenantId);
    if (!rule) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Rule not found" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "The automation rule does not exist or is not accessible." }), _jsx("div", { className: "mt-4", children: _jsx(Link, { href: "/automation", className: "text-[var(--z-accent)] underline", children: "Back to rules" }) })] }));
    }
    await logAudit("automation.rule.view", {
        tenantId,
        profileId: session.userId,
        ruleId: rule.id,
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { href: "/automation", className: "inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to rules" }), _jsx(AutomationEditor, { tenantId: tenantId, rule: rule })] }));
}
