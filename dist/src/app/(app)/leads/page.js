import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadDashboard } from "@/lib/leads/service";
import { LeadTable, LeadSourceChart } from "./components";
export const dynamic = "force-dynamic";
function parseFilters(params) {
    const filters = {};
    if (typeof params.stage === "string")
        filters.stage = params.stage;
    if (typeof params.source === "string")
        filters.source = params.source;
    if (typeof params.assignedTo === "string")
        filters.assignedTo = params.assignedTo;
    if (typeof params.locationId === "string")
        filters.locationId = params.locationId;
    if (typeof params.q === "string")
        filters.search = params.q;
    return filters;
}
function Kpi({ label, value, sublabel, accent, }) {
    const tone = accent === "success"
        ? "border-emerald-500/30"
        : accent === "warning"
            ? "border-amber-500/30"
            : accent === "danger"
                ? "border-red-500/30"
                : "border-[var(--z-border)]";
    return (_jsxs("div", { className: `rounded-[var(--z-radius-lg)] border ${tone} bg-[var(--z-surface)] p-4`, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value }), sublabel ? (_jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: sublabel })) : null] }));
}
export default async function LeadsDashboardPage({ searchParams, }) {
    var _a, _b;
    let session;
    try {
        session = await requirePermission("leads.read")();
    }
    catch (_c) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You need the leads.read permission to view this page." })] }));
    }
    const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const resolved = (_b = (await searchParams)) !== null && _b !== void 0 ? _b : {};
    const filters = parseFilters(resolved);
    const data = await getLeadDashboard(tenantId, filters);
    await logAudit("leads.dashboard.view", {
        tenantId,
        profileId: session.userId,
        filters,
        generatedAt: data.generatedAt,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-4 scroll-mt-24", children: [_jsx("header", { className: "flex items-end justify-between gap-3 flex-wrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Overview" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Lead dashboard" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(Kpi, { label: "Total", value: data.totals.all }), _jsx(Kpi, { label: "Open", value: data.totals.open, accent: data.totals.open > 10 ? "warning" : "default" }), _jsx(Kpi, { label: "Converted", value: data.totals.converted, accent: "success" }), _jsx(Kpi, { label: "Hot", value: data.totals.hot, accent: "danger" }), _jsx(Kpi, { label: "Warm", value: data.totals.warm, accent: "warning" }), _jsx(Kpi, { label: "Cold", value: data.totals.cold })] })] }), _jsxs("section", { id: "pipeline", className: "grid grid-cols-1 lg:grid-cols-5 gap-4 scroll-mt-24", children: [_jsxs("div", { className: "lg:col-span-3 space-y-3", children: [_jsxs("header", { className: "flex items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Pipeline" }), _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Leads" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Showing ", Math.min(data.leads.length, 200), " of", " ", data.leads.length.toLocaleString()] })] }), _jsx(LeadTable, { leads: data.leads })] }), _jsx("div", { id: "sources", className: "lg:col-span-2 scroll-mt-24", children: _jsx(LeadSourceChart, { stats: data.sourceStats }) })] }), _jsxs("section", { id: "qualification", className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 scroll-mt-24", children: [_jsxs("header", { className: "mb-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Qualification mix" }), _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Pipeline quality" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Kpi, { label: "Hot", value: data.totals.hot, accent: "danger" }), _jsx(Kpi, { label: "Warm", value: data.totals.warm, accent: "warning" }), _jsx(Kpi, { label: "Cold", value: data.totals.cold })] })] })] }));
}
