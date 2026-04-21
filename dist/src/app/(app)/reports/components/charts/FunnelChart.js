import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colorFor } from "./shared";
export function FunnelChart({ stages, height = 280, title }) {
    if (!stages || stages.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]", style: { minHeight: height }, children: "No data." }));
    }
    const max = Math.max(1, ...stages.map((s) => s.value));
    const width = 600;
    const rowHeight = Math.max(24, Math.floor(height / stages.length));
    return (_jsxs("div", { children: [title ? (_jsx("div", { className: "mb-2 text-xs font-semibold text-[var(--z-fg)]", children: title })) : null, _jsx("svg", { viewBox: `0 0 ${width} ${rowHeight * stages.length}`, className: "w-full h-auto", children: stages.map((stage, i) => {
                    const w = (stage.value / max) * width;
                    const x = (width - w) / 2;
                    const y = i * rowHeight + 2;
                    const prev = i === 0 ? stage.value : stages[i - 1].value;
                    const dropoff = prev > 0 ? Math.round(((prev - stage.value) / prev) * 100) : 0;
                    return (_jsxs("g", { children: [_jsx("rect", { x: x, y: y, width: w, height: rowHeight - 4, rx: 4, fill: colorFor(i), fillOpacity: 0.85 }), _jsxs("text", { x: width / 2, y: y + rowHeight / 2, fill: "#0b0b0d", textAnchor: "middle", dominantBaseline: "middle", fontSize: 12, fontWeight: 600, children: [stage.label, ": ", stage.value, i > 0 ? ` (-${dropoff}%)` : ""] })] }, stage.label));
                }) })] }));
}
