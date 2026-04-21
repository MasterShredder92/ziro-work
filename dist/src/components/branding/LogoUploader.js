"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LogoUploader({ lightUrl, darkUrl, onLightChange, onDarkChange, disabled, }) {
    return (_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsx(Field, { label: "Logo (light background)", value: lightUrl !== null && lightUrl !== void 0 ? lightUrl : "", onChange: (v) => onLightChange(v || null), disabled: disabled }), _jsx(Field, { label: "Logo (dark background)", value: darkUrl !== null && darkUrl !== void 0 ? darkUrl : "", onChange: (v) => onDarkChange(v || null), disabled: disabled })] }));
}
function Field({ label, value, onChange, disabled, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("input", { type: "url", placeholder: "https://\u2026", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }));
}
