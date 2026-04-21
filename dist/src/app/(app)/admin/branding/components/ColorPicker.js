"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
function isValidHex(v) {
    return /^#?[0-9a-fA-F]{3,8}$/.test(v);
}
function normalizeHex(v) {
    const s = v.trim();
    if (!s)
        return "#000000";
    return s.startsWith("#") ? s : `#${s}`;
}
export function ColorPicker({ label, value, onChange, disabled, description, }) {
    const [text, setText] = useState(value);
    useEffect(() => {
        setText(value);
    }, [value]);
    const commit = (next) => {
        const normalized = normalizeHex(next);
        onChange(normalized);
    };
    return (_jsxs("label", { className: "flex flex-col gap-1.5", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: isValidHex(text) ? normalizeHex(text) : "#000000", onChange: (e) => {
                            setText(e.target.value);
                            commit(e.target.value);
                        }, disabled: disabled, className: "h-9 w-12 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] p-1", "aria-label": `${label} color` }), _jsx("input", { type: "text", value: text, onChange: (e) => {
                            const next = e.target.value;
                            setText(next);
                            if (isValidHex(next))
                                commit(next);
                        }, onBlur: () => {
                            if (isValidHex(text))
                                commit(text);
                            else
                                setText(value);
                        }, disabled: disabled, className: "h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)] font-mono", "aria-label": `${label} hex` })] }), description ? (_jsx("span", { className: "text-[11px] text-[var(--z-muted)]", children: description })) : null] }));
}
