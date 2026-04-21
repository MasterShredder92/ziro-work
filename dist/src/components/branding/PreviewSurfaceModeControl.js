"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MODES = ["theme", "portal"];
const LABELS = {
    theme: "Theme Preview",
    portal: "Portal Preview",
};
export function PreviewSurfaceModeControl({ value, onChange, id = "branding-preview-surface", }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("span", { id: `${id}-label`, className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]", children: "Preview surface" }), _jsx("div", { role: "tablist", "aria-labelledby": `${id}-label`, className: "inline-flex rounded-[8px] border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface-2,#141416)] p-0.5", children: MODES.map((m) => {
                    const selected = value === m;
                    return (_jsx("button", { type: "button", role: "tab", "aria-selected": selected, onClick: () => onChange(m), className: `min-w-[6.5rem] rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition ${selected
                            ? "bg-[var(--z-surface,#1a1a1c)] text-[var(--z-fg,#f0f0f0)] shadow-sm"
                            : "text-[var(--z-muted,#909098)] hover:text-[var(--z-fg,#f0f0f0)]"}`, children: LABELS[m] }, m));
                }) })] }));
}
