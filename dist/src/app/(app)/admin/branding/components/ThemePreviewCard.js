"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ThemePreviewCard({ theme, active, onSelect, onDelete, disabled, }) {
    const { colors, typography } = theme.tokens;
    return (_jsxs("div", { className: `flex flex-col gap-2 rounded-[var(--z-radius-lg)] border p-3 ${active
            ? "border-[#00ff88] ring-1 ring-[#00ff88]/60"
            : "border-[var(--z-border)]"} bg-[var(--z-surface)]`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: theme.name }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] font-mono", children: theme.theme_key })] }), theme.is_system ? (_jsx("span", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] border border-[var(--z-border)] rounded px-1.5 py-0.5", children: "System" })) : null] }), _jsx("div", { className: "flex h-20 items-center justify-center rounded-[var(--z-radius-md)] border border-black/20", style: {
                    background: colors.background,
                    color: colors.primary,
                    fontFamily: typography.headingFamily,
                }, children: _jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("div", { className: "text-lg font-semibold", style: { color: colors.primary }, children: "Aa" }), _jsx("div", { className: "text-[10px]", style: { color: colors.accent }, children: "Preview" })] }) }), _jsx("div", { className: "grid grid-cols-5 gap-1", children: [
                    ["P", colors.primary],
                    ["S", colors.secondary],
                    ["A", colors.accent],
                    ["B", colors.background],
                    ["U", colors.surface],
                ].map(([letter, color]) => (_jsx("div", { className: "flex h-6 items-center justify-center rounded text-[10px] font-bold border border-black/30", style: { background: color, color: readableOn(color) }, title: `${letter} · ${color}`, children: letter }, letter))) }), theme.description ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: theme.description })) : null, _jsxs("div", { className: "flex items-center justify-between gap-2", children: [onSelect ? (_jsx("button", { type: "button", disabled: disabled || active, onClick: () => onSelect(theme.theme_key), className: "h-8 flex-1 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: active ? "Applied" : "Apply" })) : null, onDelete && !theme.is_system ? (_jsx("button", { type: "button", disabled: disabled, onClick: () => onDelete(theme.theme_key), className: "h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-50", children: "Delete" })) : null] })] }));
}
function readableOn(bgColor) {
    const hex = bgColor.startsWith("#") ? bgColor.slice(1) : bgColor;
    if (hex.length < 6)
        return "#000000";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
}
