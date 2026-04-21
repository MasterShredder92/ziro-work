"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BRANDING_PREVIEW_DEVICES } from "./previewDevice";
const LABELS = {
    desktop: "Desktop",
    tablet: "Tablet",
    phone: "Phone",
};
export function PreviewDeviceSegmentedControl({ value, onChange, id = "branding-preview-device", }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("span", { id: `${id}-label`, className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]", children: "Preview device" }), _jsx("div", { role: "radiogroup", "aria-labelledby": `${id}-label`, className: "inline-flex rounded-[8px] border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface-2,#141416)] p-0.5", children: BRANDING_PREVIEW_DEVICES.map((d) => {
                    const selected = value === d;
                    return (_jsx("button", { type: "button", role: "radio", "aria-checked": selected, onClick: () => onChange(d), className: `min-w-[4.5rem] rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition ${selected
                            ? "bg-[var(--z-surface,#1a1a1c)] text-[var(--z-fg,#f0f0f0)] shadow-sm"
                            : "text-[var(--z-muted,#909098)] hover:text-[var(--z-fg,#f0f0f0)]"}`, children: LABELS[d] }, d));
                }) })] }));
}
