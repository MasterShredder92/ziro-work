import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { getSystemHealth } from "@/lib/admin/adminOs";
import { KpiCard } from "../components/KpiCard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function resolveTenantId(params) {
    const v = params.tenantId;
    const paramValue = Array.isArray(v) ? v[0] : v;
    if (paramValue && paramValue.trim())
        return paramValue.trim();
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader && fromHeader.trim().length > 0)
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
export default async function SystemHealthPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveTenantId(params);
    await requirePermission("admin.system_health.read")();
    const health = await getSystemHealth(tenantId);
    return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Admin OS" }), _jsx("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: "System health" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Background jobs, automation failures, and storage usage." })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4", children: [_jsx(KpiCard, { label: "Automation rules", value: String(health.automations.totalRules), sublabel: `${health.automations.activeRules} active` }), _jsx(KpiCard, { label: "Recent failures", value: String(health.automations.recentFailures), accent: health.automations.recentFailures > 0 ? "warning" : "default", sublabel: "Last 200 runs" }), _jsx(KpiCard, { label: "Audit events (24h)", value: String(health.auditing.last24hCount), sublabel: health.auditing.tableAvailable
                            ? "Audit table online"
                            : "Fallback in-memory store", accent: health.auditing.tableAvailable ? "default" : "warning" }), _jsx(KpiCard, { label: "Storage used", value: `${health.storage.usedMb} MB`, sublabel: `Limit ${health.storage.limitMb} MB` })] }), _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Snapshot" }), _jsx("pre", { className: "mt-3 max-h-[400px] overflow-auto text-xs", children: JSON.stringify(health, null, 2) })] })] }));
}
