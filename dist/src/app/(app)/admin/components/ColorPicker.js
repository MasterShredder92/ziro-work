"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ColorPicker({ label, value, onChange, disabled }) {
    const v = value !== null && value !== void 0 ? value : "#000000";
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: v, disabled: disabled, onChange: (e) => onChange(e.target.value), className: "h-9 w-12 cursor-pointer rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] disabled:cursor-not-allowed" }), _jsx("input", { type: "text", value: v, disabled: disabled, onChange: (e) => onChange(e.target.value), className: "h-9 w-28 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 font-mono text-xs" })] })] }));
}
