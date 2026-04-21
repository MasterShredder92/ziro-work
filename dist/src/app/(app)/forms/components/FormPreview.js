import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FormPreview({ form, fields }) {
    const ordered = [...fields].sort((a, b) => a.position - b.position);
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: form.name || "Untitled form" }), form.description ? (_jsx("div", { className: "text-sm text-[var(--z-muted)] mt-1", children: form.description })) : null] }), ordered.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]", children: "Add fields to preview the form." })) : (_jsx("div", { className: "space-y-4", children: ordered.map((field) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "text-sm font-medium text-[var(--z-fg)]", children: [field.label, field.required ? (_jsx("span", { className: "text-red-400 ml-1", children: "*" })) : null] }), renderField(field), field.helpText ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: field.helpText })) : null] }, field.id))) })), _jsx("div", { children: _jsx("button", { type: "button", disabled: true, className: "rounded-[var(--z-radius-md)] bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm opacity-80", children: form.submitLabel || "Submit" }) })] }));
}
function renderField(field) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const inputCls = "w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm";
    const ftype = String(field.fieldType);
    switch (ftype) {
        case "textarea":
            return (_jsx("textarea", { disabled: true, placeholder: (_a = field.placeholder) !== null && _a !== void 0 ? _a : "", className: inputCls, rows: 4 }));
        case "select":
            return (_jsxs("select", { disabled: true, className: inputCls, children: [_jsx("option", { value: "", children: (_b = field.placeholder) !== null && _b !== void 0 ? _b : "Choose…" }), ((_c = field.options) !== null && _c !== void 0 ? _c : []).map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value)))] }));
        case "radio":
            return (_jsx("div", { className: "space-y-1", children: ((_d = field.options) !== null && _d !== void 0 ? _d : []).map((o) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "radio", disabled: true }), " ", o.label] }, o.value))) }));
        case "multiselect":
            return (_jsx("div", { className: "space-y-1", children: ((_e = field.options) !== null && _e !== void 0 ? _e : []).map((o) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", disabled: true }), " ", o.label] }, o.value))) }));
        case "boolean":
        case "checkbox":
            return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", disabled: true }), " ", (_f = field.placeholder) !== null && _f !== void 0 ? _f : "Confirm"] }));
        case "date":
            return _jsx("input", { type: "date", disabled: true, className: inputCls });
        case "datetime":
            return _jsx("input", { type: "datetime-local", disabled: true, className: inputCls });
        case "number":
        case "rating":
            return (_jsx("input", { type: "number", disabled: true, placeholder: (_g = field.placeholder) !== null && _g !== void 0 ? _g : "", className: inputCls }));
        case "email":
            return (_jsx("input", { type: "email", disabled: true, placeholder: (_h = field.placeholder) !== null && _h !== void 0 ? _h : "", className: inputCls }));
        case "phone":
            return (_jsx("input", { type: "tel", disabled: true, placeholder: (_j = field.placeholder) !== null && _j !== void 0 ? _j : "", className: inputCls }));
        case "url":
            return (_jsx("input", { type: "url", disabled: true, placeholder: (_k = field.placeholder) !== null && _k !== void 0 ? _k : "", className: inputCls }));
        case "hidden":
            return (_jsx("div", { className: "text-xs text-[var(--z-muted)] font-mono", children: "hidden input" }));
        default:
            return (_jsx("input", { type: "text", disabled: true, placeholder: (_l = field.placeholder) !== null && _l !== void 0 ? _l : "", className: inputCls }));
    }
}
