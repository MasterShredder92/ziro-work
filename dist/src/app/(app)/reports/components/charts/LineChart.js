import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colorFor, collectLabels, maxY, } from "./shared";
export function LineChart({ series, height = 240, title, showAxis = true, }) {
    if (!series.length)
        return _jsx(EmptyChart, { height: height });
    const labels = collectLabels(series);
    const max = maxY(series);
    const width = 600;
    const padding = { top: 12, right: 16, bottom: 28, left: 36 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const step = innerW / Math.max(1, labels.length - 1);
    return (_jsxs("div", { children: [title ? _jsx(ChartTitle, { title: title }) : null, _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full h-auto", children: [showAxis ? _jsx(Grid, { innerW: innerW, innerH: innerH, padding: padding }) : null, series.map((s, i) => {
                        const points = labels
                            .map((label, idx) => {
                            const p = s.data.find((pt) => String(pt.x) === label);
                            const y = p ? (p.y / max) * innerH : 0;
                            return `${padding.left + idx * step},${padding.top + innerH - y}`;
                        })
                            .join(" ");
                        return (_jsxs("g", { children: [_jsx("polyline", { fill: "none", stroke: colorFor(i), strokeWidth: 2, points: points }), s.data.map((p, idx) => {
                                    const labelIdx = labels.indexOf(String(p.x));
                                    if (labelIdx < 0)
                                        return null;
                                    const y = (p.y / max) * innerH;
                                    return (_jsx("circle", { cx: padding.left + labelIdx * step, cy: padding.top + innerH - y, r: 3, fill: colorFor(i) }, idx));
                                })] }, s.id));
                    }), labels.map((label, i) => (_jsx("text", { x: padding.left + i * step, y: height - 8, fill: "currentColor", fontSize: 10, textAnchor: "middle", className: "text-[var(--z-muted)]", children: label }, label)))] })] }));
}
function Grid({ innerW, innerH, padding, }) {
    const rows = 4;
    return (_jsx("g", { className: "text-[var(--z-border)]", children: Array.from({ length: rows + 1 }).map((_, i) => {
            const y = padding.top + (innerH / rows) * i;
            return (_jsx("line", { x1: padding.left, y1: y, x2: padding.left + innerW, y2: y, stroke: "currentColor", strokeOpacity: 0.35 }, i));
        }) }));
}
function ChartTitle({ title }) {
    return _jsx("div", { className: "mb-2 text-xs font-semibold text-[var(--z-fg)]", children: title });
}
function EmptyChart({ height }) {
    return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]", style: { minHeight: height }, children: "No data." }));
}
