import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function RubricView({ rubric }) {
    if (rubric.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "No rubric attached to this assessment." }));
    }
    return (_jsx("div", { className: "overflow-x-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-3 py-2", children: "Criterion" }), _jsx("th", { className: "px-3 py-2", children: "Description" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Max" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Weight" })] }) }), _jsx("tbody", { children: rubric.map((r) => {
                        var _a;
                        return (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 font-medium text-[var(--z-fg)]", children: r.criterion }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: (_a = r.description) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-3 py-2 text-right text-[var(--z-fg)]", children: r.max_points }), _jsxs("td", { className: "px-3 py-2 text-right text-[var(--z-muted)]", children: [r.weight, "\u00D7"] })] }, r.id));
                    }) })] }) }));
}
