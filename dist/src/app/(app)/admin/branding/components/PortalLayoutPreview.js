"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SIDEBAR_LABEL = {
    icons_only: "Icons only",
    icons_labels: "Icons + labels",
    collapsible: "Collapsible",
};
const SIZE_SPAN = {
    sm: "col-span-1",
    md: "col-span-1 md:col-span-1",
    lg: "col-span-2",
    full: "col-span-2 md:col-span-3",
};
export function PortalLayoutPreview({ layout, scopeLabel, }) {
    const sidebarWidth = layout.sidebar_variant === "icons_only"
        ? "w-10"
        : layout.sidebar_variant === "collapsible"
            ? "w-16"
            : "w-40";
    const density = layout.preset === "compact"
        ? "p-1.5 text-[11px]"
        : layout.preset === "minimal"
            ? "p-3 text-xs"
            : "p-2 text-xs";
    const gridCols = layout.dashboard_preset === "focus"
        ? "grid-cols-1"
        : layout.dashboard_preset === "feed"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-2 md:grid-cols-3";
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between pb-2", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: scopeLabel !== null && scopeLabel !== void 0 ? scopeLabel : "Portal preview" }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)] font-mono", children: [layout.preset, " \u00B7 ", SIDEBAR_LABEL[layout.sidebar_variant], " \u00B7 ", layout.dashboard_preset] })] }), _jsxs("div", { className: "flex gap-2 h-56 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] overflow-hidden", children: [_jsx("div", { className: `${sidebarWidth} shrink-0 border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_12%)] flex flex-col gap-1 ${density}`, children: ["▦", "☺", "⌚", "♪", "★", "$"].map((icon, idx) => (_jsxs("div", { className: "h-6 rounded flex items-center gap-2 px-1", style: {
                                background: idx === 0
                                    ? "color-mix(in oklab, var(--z-accent), transparent 80%)"
                                    : "transparent",
                            }, children: [_jsx("span", { className: "inline-flex w-3 justify-center text-[var(--z-fg)]", children: icon }), layout.sidebar_variant !== "icons_only" &&
                                    layout.sidebar_variant !== "collapsible" ? (_jsxs("span", { className: "truncate text-[var(--z-fg)]", children: ["Item ", idx + 1] })) : null] }, idx))) }), _jsxs("div", { className: "flex-1 min-w-0 p-2 overflow-hidden", children: [_jsx("div", { className: "mb-2 h-5 w-32 rounded bg-[color-mix(in_oklab,var(--z-fg),transparent_80%)]" }), _jsx("div", { className: `grid gap-1.5 ${gridCols}`, children: layout.widgets.slice(0, 6).map((w) => (_jsxs("div", { className: `${SIZE_SPAN[w.size]} rounded border border-[var(--z-border)] bg-[var(--z-surface)] ${density}`, children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: w.size }), _jsx("div", { className: "truncate text-[var(--z-fg)]", children: w.title })] }, w.id))) })] })] })] }));
}
