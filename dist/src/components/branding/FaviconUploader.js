"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FaviconUploader({ favicon, app192, app512, onChange, disabled, }) {
    return (_jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [_jsx(UrlField, { label: "Favicon", value: favicon !== null && favicon !== void 0 ? favicon : "", onChange: (v) => onChange({ favicon: v || null }), disabled: disabled }), _jsx(UrlField, { label: "App icon 192", value: app192 !== null && app192 !== void 0 ? app192 : "", onChange: (v) => onChange({ appIcon192: v || null }), disabled: disabled }), _jsx(UrlField, { label: "App icon 512", value: app512 !== null && app512 !== void 0 ? app512 : "", onChange: (v) => onChange({ appIcon512: v || null }), disabled: disabled })] }));
}
function UrlField({ label, value, onChange, disabled, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("input", { type: "url", placeholder: "https://\u2026", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }));
}
