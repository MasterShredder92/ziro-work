"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ColorPicker({ label, value, onChange, disabled }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: value.startsWith("#") ? value.slice(0, 7) : "#000000", onChange: (e) => onChange(e.target.value), disabled: disabled, className: "h-9 w-12 cursor-pointer rounded border border-[var(--z-border)] bg-[var(--z-surface)] p-0.5" }), _jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 font-mono text-sm text-[var(--z-fg)]" })] })] }));
}
