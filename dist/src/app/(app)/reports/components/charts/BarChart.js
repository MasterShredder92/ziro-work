import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colorFor, collectLabels, maxY } from "./shared";
export function BarChart({ series, height = 240, title, stacked = false, }) {
    if (!series.length)
        return _jsx(Empty, { height: height });
    const labels = collectLabels(series);
    const width = 600;
    const padding = { top: 12, right: 16, bottom: 28, left: 36 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const groupWidth = innerW / Math.max(1, labels.length);
    const max = stacked
        ? Math.max(1, ...labels.map((label) => series.reduce((sum, s) => { var _a, _b; return sum + ((_b = (_a = s.data.find((p) => String(p.x) === label)) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0); }, 0)))
        : maxY(series);
    const barWidth = stacked
        ? Math.max(4, groupWidth - 8)
        : Math.max(2, groupWidth / Math.max(1, series.length) - 4);
    return (_jsxs("div", { children: [title ? (_jsx("div", { className: "mb-2 text-xs font-semibold text-[var(--z-fg)]", children: title })) : null, _jsx("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full h-auto", children: labels.map((label, i) => {
                    const groupX = padding.left + i * groupWidth;
                    if (stacked) {
                        let offset = 0;
                        return (_jsxs("g", { children: [series.map((s, sIdx) => {
                                    var _a;
                                    const point = s.data.find((p) => String(p.x) === label);
                                    const val = (_a = point === null || point === void 0 ? void 0 : point.y) !== null && _a !== void 0 ? _a : 0;
                                    const h = (val / max) * innerH;
                                    const y = padding.top + innerH - offset - h;
                                    offset += h;
                                    return (_jsx("rect", { x: groupX + (groupWidth - barWidth) / 2, y: y, width: barWidth, height: h, fill: colorFor(sIdx) }, s.id));
                                }), _jsx("text", { x: groupX + groupWidth / 2, y: height - 8, fill: "currentColor", fontSize: 10, textAnchor: "middle", className: "text-[var(--z-muted)]", children: label })] }, label));
                    }
                    return (_jsxs("g", { children: [series.map((s, sIdx) => {
                                var _a;
                                const point = s.data.find((p) => String(p.x) === label);
                                const val = (_a = point === null || point === void 0 ? void 0 : point.y) !== null && _a !== void 0 ? _a : 0;
                                const h = (val / max) * innerH;
                                const x = groupX +
                                    sIdx * (barWidth + 4) +
                                    (groupWidth - series.length * (barWidth + 4)) / 2;
                                return (_jsx("rect", { x: x, y: padding.top + innerH - h, width: barWidth, height: h, fill: colorFor(sIdx), rx: 2 }, s.id));
                            }), _jsx("text", { x: groupX + groupWidth / 2, y: height - 8, fill: "currentColor", fontSize: 10, textAnchor: "middle", className: "text-[var(--z-muted)]", children: label })] }, label));
                }) })] }));
}
function Empty({ height }) {
    return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]", style: { minHeight: height }, children: "No data." }));
}
