import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getAutomationDashboard } from "@/lib/automation/workflows/service";
import { RunList } from "./components/workflows";
import { WorkflowList } from "./components/workflows";
export const dynamic = "force-dynamic";
function Kpi({ label, value, sublabel, accent, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-2xl font-semibold ${accent !== null && accent !== void 0 ? accent : "text-[var(--z-fg)]"}`, children: value }), sublabel ? (_jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: sublabel })) : null] }));
}
export default async function AutomationDashboardPage() {
    let session;
    try {
        session = await requirePermission("automation.read")();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view Automation OS." })] }));
    }
    const tenantId = session.tenantId || DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_b) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Tenant access denied." })] }));
    }
    const data = await getAutomationDashboard(tenantId);
    await logAudit("automation.dashboard.view", {
        tenantId,
        profileId: session.userId,
        workflows: data.workflows.length,
        runs: data.recentRuns.length,
    });
    const canWrite = canForRole(session.role, "automation.write");
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Automation OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Dashboard" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [data.kpis.totalWorkflows, " workflows \u00B7 ", data.kpis.activeWorkflows, " active \u00B7 tenant", " ", _jsx("span", { className: "font-mono", children: tenantId.slice(0, 8) })] })] }), canWrite ? (_jsx(Link, { href: "/automation/workflows/new", className: "rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679]", children: "New workflow" })) : null] }), _jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(Kpi, { label: "Active workflows", value: String(data.kpis.activeWorkflows), sublabel: `${data.kpis.totalWorkflows} total`, accent: "text-[#00ff88]" }), _jsx(Kpi, { label: "Runs (24h)", value: String(data.kpis.runsLast24h), sublabel: `${data.kpis.failureCountLast24h} failed` }), _jsx(Kpi, { label: "Success rate", value: data.kpis.runsLast24h > 0 ? `${data.kpis.successRatePct}%` : "—", sublabel: "24h", accent: "text-[#00ff88]" }), _jsx(Kpi, { label: "Dead-letter", value: String(data.kpis.deadLetterCount), sublabel: `avg ${data.kpis.avgDurationMs}ms`, accent: data.kpis.deadLetterCount > 0 ? "text-rose-300" : undefined })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-end justify-between", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Active workflows" }), _jsx(Link, { href: "/automation/workflows", className: "text-xs text-[#00ff88] hover:underline", children: "View all \u2192" })] }), _jsx(WorkflowList, { workflows: data.workflows.slice(0, 8), canWrite: canWrite })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-end justify-between", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Recent runs" }), _jsx(Link, { href: "/automation/runs", className: "text-xs text-[#00ff88] hover:underline", children: "View all \u2192" })] }), _jsx(RunList, { runs: data.recentRuns.slice(0, 10), showWorkflow: true })] }), data.failures.length > 0 ? (_jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-rose-300", children: "Recent failures" }), _jsx(RunList, { runs: data.failures.slice(0, 10), showWorkflow: true })] })) : null] }));
}
