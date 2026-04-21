import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { KPIBlock } from "./charts/KPIBlock";
export function KpiSnapshotGrid({ values }) {
    var _a;
    if (!values || values.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-sm text-[var(--z-muted)]", children: "No KPI snapshot available yet." }));
    }
    const byCategory = new Map();
    for (const v of values) {
        const list = (_a = byCategory.get(v.category)) !== null && _a !== void 0 ? _a : [];
        list.push(v);
        byCategory.set(v.category, list);
    }
    return (_jsx("div", { className: "space-y-6", children: Array.from(byCategory.entries()).map(([category, list]) => (_jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: [category, _jsx("span", { className: "text-[var(--z-muted)]/60", children: "\u00B7" }), _jsxs("span", { className: "text-[var(--z-muted)]/60", children: [list.length, " metrics"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3", children: list.map((v) => (_jsx(KPIBlock, { kpi: v }, v.key))) })] }, category))) }));
}
