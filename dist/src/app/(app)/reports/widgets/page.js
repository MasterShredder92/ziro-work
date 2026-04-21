import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { listKpiDefinitions } from "@/lib/reports/kpis";
import { BarChart } from "../components/charts/BarChart";
import { LineChart } from "../components/charts/LineChart";
import { PieChart, DonutChart } from "../components/charts/PieChart";
import { FunnelChart } from "../components/charts/FunnelChart";
export const dynamic = "force-dynamic";
const DEMO_SERIES = [
    { id: "a", label: "Series A", data: [
            { x: "Jan", y: 12 }, { x: "Feb", y: 18 }, { x: "Mar", y: 9 },
            { x: "Apr", y: 22 }, { x: "May", y: 30 }, { x: "Jun", y: 25 },
        ] },
    { id: "b", label: "Series B", data: [
            { x: "Jan", y: 8 }, { x: "Feb", y: 14 }, { x: "Mar", y: 16 },
            { x: "Apr", y: 11 }, { x: "May", y: 19 }, { x: "Jun", y: 28 },
        ] },
];
const DEMO_CATEGORIES = {
    id: "c",
    label: "Distribution",
    data: [
        { x: "Piano", y: 42 },
        { x: "Guitar", y: 28 },
        { x: "Voice", y: 18 },
        { x: "Violin", y: 12 },
    ],
};
const DEMO_FUNNEL = [
    { label: "Leads", value: 1200 },
    { label: "Scheduled", value: 800 },
    { label: "Trial booked", value: 520 },
    { label: "Enrolled", value: 280 },
];
const WIDGET_META = [
    { type: "kpi", name: "KPI block", description: "Single metric with trend." },
    { type: "line_chart", name: "Line chart", description: "Trend over a date bucket." },
    { type: "bar_chart", name: "Bar chart", description: "Group comparison or stacked totals." },
    { type: "pie_chart", name: "Pie chart", description: "Part-to-whole split." },
    { type: "donut_chart", name: "Donut chart", description: "Pie with a center total." },
    { type: "funnel_chart", name: "Funnel", description: "Stage-by-stage conversion." },
    { type: "table", name: "Table", description: "Raw rows with formatted cells." },
    { type: "pivot", name: "Pivot table", description: "Cross-tab with aggregates." },
];
export default async function WidgetLibraryPage() {
    var _a;
    let session = null;
    try {
        session = await requirePermission("reports.read")();
    }
    catch (_b) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_c) {
            session = null;
        }
    }
    const kpis = listKpiDefinitions();
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("section", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Reporting OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Widget library" }), _jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[720px]", children: "Reusable visualization blocks. Each widget can be bound to a KPI or query inside a saved report." })] }), _jsxs("section", { children: [_jsx("h2", { className: "mb-3 text-sm font-semibold text-[var(--z-fg)]", children: "Available widget types" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3", children: WIDGET_META.map((w) => (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: w.type }), _jsx("div", { className: "mt-1 text-sm font-semibold text-[var(--z-fg)]", children: w.name }), _jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: w.description })] }, w.type))) })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Visualization previews" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(LineChart, { series: DEMO_SERIES, title: "Line chart" }) }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(BarChart, { series: DEMO_SERIES, title: "Bar chart" }) }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(PieChart, { series: DEMO_CATEGORIES, title: "Pie chart" }) }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(DonutChart, { series: DEMO_CATEGORIES, title: "Donut chart" }) }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 md:col-span-2", children: _jsx(FunnelChart, { stages: DEMO_FUNNEL, title: "Conversion funnel" }) })] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Available KPIs" }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Key" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Category" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Format" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Direction" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Description" })] }) }), _jsx("tbody", { children: kpis.map((k) => (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 font-mono text-[11px] text-[var(--z-fg)]", children: k.key }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: k.category }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: k.format }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: k.direction }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: k.description })] }, k.key))) })] }) })] })] }));
}
