import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function statusTone(status) {
    switch (status) {
        case "completed":
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        case "active":
            return "bg-sky-500/10 text-sky-400 border-sky-500/30";
        case "draft":
            return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
        case "archived":
            return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    }
}
export function GoalList({ goals, title = "Goals", emptyLabel = "No goals set yet.", }) {
    if (goals.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: _jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }) }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: goals.map((g) => (_jsxs("li", { className: "px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: g.title }), g.description ? (_jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: g.description })) : null] }), _jsx("span", { className: `rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(g.status)}`, children: g.status })] }), g.target_date ? (_jsxs("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: ["Target: ", new Date(g.target_date).toLocaleDateString()] })) : null] }, g.id))) })] }));
}
