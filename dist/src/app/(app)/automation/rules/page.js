import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { listAutomationRules } from "@/lib/automation/queries";
import { AutomationList } from "../components/AutomationList";
export const dynamic = "force-dynamic";
export default async function AutomationRulesPage() {
    let session;
    try {
        session = await requirePermission("automation.read")();
    }
    catch (_a) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const tenantId = session.tenantId || DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const rules = await listAutomationRules(tenantId);
    await logAudit("automation.rules.list", {
        tenantId,
        profileId: session.userId,
        count: rules.length,
    });
    const canWrite = canForRole(session.role, "automation.write");
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Legacy rules" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Automation rules" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [rules.length, " rule", rules.length === 1 ? "" : "s", " \u00B7 tenant", " ", _jsx("span", { className: "font-mono", children: tenantId.slice(0, 8) })] })] }), canWrite ? (_jsx(Link, { href: "/automation/new", className: "rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679]", children: "New rule" })) : null] }), _jsx(AutomationList, { rules: rules })] }));
}
