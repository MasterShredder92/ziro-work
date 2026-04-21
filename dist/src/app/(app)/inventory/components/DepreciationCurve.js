import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}
export function DepreciationCurve({ record }) {
    var _a, _b;
    const max = Math.max(record.purchasePrice, 1);
    const points = record.curve;
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Depreciation curve" }), _jsxs("p", { className: "mt-1 text-sm text-[var(--z-fg)]", children: [record.method.replace("_", " "), " \u00B7 ", record.usefulLifeMonths, " mo useful life"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: "Current" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: formatCurrency(record.currentValue) })] })] }), _jsx("div", { className: "mt-4 grid grid-cols-[repeat(13,minmax(0,1fr))] items-end gap-1 h-24", children: points.map((p) => {
                    const height = Math.max(2, Math.round((p.value / max) * 100));
                    return (_jsx("div", { className: "relative flex h-full items-end", title: `${p.date}: ${formatCurrency(p.value)}`, children: _jsx("div", { className: "w-full rounded-sm bg-[color-mix(in_oklab,var(--z-accent),transparent_40%)]", style: { height: `${height}%` } }) }, `${p.month}-${p.date}`));
                }) }), _jsxs("div", { className: "mt-3 flex justify-between text-[10px] text-[var(--z-muted)]", children: [_jsx("span", { children: "Month 0" }), _jsxs("span", { children: ["Month ", (_b = (_a = points[points.length - 1]) === null || _a === void 0 ? void 0 : _a.month) !== null && _b !== void 0 ? _b : 0] })] }), _jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Purchase" }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: formatCurrency(record.purchasePrice) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Salvage" }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: formatCurrency(record.salvageValue) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Accumulated" }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: formatCurrency(record.accumulated) })] })] })] }));
}
