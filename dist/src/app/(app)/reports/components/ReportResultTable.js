import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatValue(value, format) {
    if (value === null || value === undefined)
        return "—";
    switch (format) {
        case "currency": {
            const cents = Number(value);
            if (!Number.isFinite(cents))
                return String(value);
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
            }).format(cents / 100);
        }
        case "percent": {
            const n = Number(value);
            if (!Number.isFinite(n))
                return String(value);
            return `${Math.round(n)}%`;
        }
        case "number": {
            const n = Number(value);
            if (!Number.isFinite(n))
                return String(value);
            return new Intl.NumberFormat("en-US").format(n);
        }
        case "date": {
            const d = new Date(String(value));
            if (Number.isNaN(d.getTime()))
                return String(value);
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
        case "text":
        default:
            return String(value);
    }
}
export function ReportResultTable({ result, maxHeight = 520, }) {
    const { columns, rows } = result;
    const gridTemplateColumns = columns
        .map((c) => (c.width ? String(c.width) : "minmax(0, 1fr)"))
        .join(" ");
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsxs("div", { className: "px-4 py-2.5 border-b border-[var(--z-border)] flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Results" }), _jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [rows.length, " row", rows.length === 1 ? "" : "s"] })] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [result.range.from, " \u2192 ", result.range.to] })] }), _jsx("div", { className: "grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]", style: { gridTemplateColumns }, children: columns.map((c) => (_jsx("div", { className: `px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)] ${c.align === "center"
                        ? "text-center"
                        : c.align === "right"
                            ? "text-right"
                            : ""}`, children: c.label }, c.key))) }), _jsx("div", { className: "overflow-auto", style: { maxHeight }, children: rows.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No data in range." })) : (rows.map((row, idx) => (_jsx("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors", style: { gridTemplateColumns }, children: columns.map((c) => (_jsx("div", { className: `px-4 py-2.5 text-sm text-[var(--z-fg)] min-w-0 truncate ${c.align === "center"
                            ? "text-center"
                            : c.align === "right"
                                ? "text-right"
                                : ""}`, children: formatValue(row[c.key], c.format) }, c.key))) }, idx)))) })] }));
}
