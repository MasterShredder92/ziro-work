"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
export function ReportParameterForm({ parameters, values, onChange, onSubmit, submitting = false, }) {
    const withDefaults = useMemo(() => {
        return parameters.map((p) => (Object.assign(Object.assign({}, p), { value: values[p.key] !== undefined && values[p.key] !== null
                ? values[p.key]
                : p.defaultValue })));
    }, [parameters, values]);
    return (_jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            onSubmit();
        }, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-4", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: withDefaults.map((p) => (_jsxs("label", { className: "flex flex-col gap-1 min-w-0", children: [_jsxs("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: [p.label, p.required ? (_jsx("span", { className: "text-[#ff6666] ml-1", children: "*" })) : null] }), _jsx(ParameterInput, { parameter: p, value: p.value, onChange: (v) => onChange(p.key, v) }), p.description ? (_jsx("span", { className: "text-[11px] text-[var(--z-muted)]", children: p.description })) : null] }, p.key))) }), _jsx("div", { className: "flex items-center justify-end gap-2 pt-2 border-t border-[var(--z-border)]", children: _jsx("button", { type: "submit", disabled: submitting, className: "inline-flex items-center gap-2 rounded-md bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00ff88]/90 transition-colors", children: submitting ? "Running…" : "Run report" }) })] }));
}
function ParameterInput({ parameter, value, onChange, }) {
    var _a, _b, _c;
    const baseClass = "rounded-md bg-[color-mix(in_oklab,var(--z-surface),black_20%)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/60";
    switch (parameter.type) {
        case "boolean":
            return (_jsx("input", { type: "checkbox", checked: Boolean(value), onChange: (e) => onChange(e.target.checked), className: "h-4 w-4 accent-[#00ff88]" }));
        case "number":
            return (_jsx("input", { type: "number", value: typeof value === "number" ? value : "", placeholder: parameter.placeholder, onChange: (e) => {
                    const n = Number(e.target.value);
                    onChange(Number.isFinite(n) ? n : null);
                }, className: baseClass }));
        case "date":
            return (_jsx("input", { type: "date", value: typeof value === "string" ? value : "", onChange: (e) => onChange(e.target.value), className: baseClass }));
        case "select":
            return (_jsxs("select", { value: typeof value === "string" ? value : "", onChange: (e) => onChange(e.target.value), className: baseClass, children: [_jsx("option", { value: "", children: "\u2014" }), ((_a = parameter.options) !== null && _a !== void 0 ? _a : []).map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }));
        case "dateRange": {
            const v = (value !== null && value !== void 0 ? value : {});
            return (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "date", value: (_b = v.from) !== null && _b !== void 0 ? _b : "", onChange: (e) => onChange(Object.assign(Object.assign({}, v), { from: e.target.value })), className: baseClass + " flex-1" }), _jsx("input", { type: "date", value: (_c = v.to) !== null && _c !== void 0 ? _c : "", onChange: (e) => onChange(Object.assign(Object.assign({}, v), { to: e.target.value })), className: baseClass + " flex-1" })] }));
        }
        case "string":
        default:
            return (_jsx("input", { type: "text", value: typeof value === "string" ? value : "", placeholder: parameter.placeholder, onChange: (e) => onChange(e.target.value), className: baseClass }));
    }
}
