"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FIELD_TYPES } from "@/lib/forms/types";
const TYPE_LABELS = {
    text: "Text",
    textarea: "Long text",
    email: "Email",
    phone: "Phone",
    number: "Number",
    date: "Date",
    datetime: "Date & time",
    select: "Dropdown",
    multiselect: "Multi-select",
    radio: "Radio",
    checkbox: "Checkbox",
    boolean: "Yes/No",
    rating: "Rating",
    url: "URL",
    hidden: "Hidden",
};
export function fieldFromRecord(record) {
    return {
        id: record.id,
        sectionId: record.sectionId,
        sectionTitle: record.sectionTitle,
        fieldKey: record.fieldKey,
        label: record.label,
        fieldType: record.fieldType,
        placeholder: record.placeholder,
        helpText: record.helpText,
        required: record.required,
        position: record.position,
        options: record.options,
        validationRules: record.validationRules,
        defaultValue: record.defaultValue,
        metadata: record.metadata,
    };
}
export function FieldEditor({ field, onUpdate, onDelete, onMoveUp, onMoveDown, }) {
    var _a, _b, _c, _d;
    const hasOptions = ["select", "multiselect", "radio"].includes(String(field.fieldType));
    const update = (patch) => onUpdate(Object.assign(Object.assign({}, field), patch));
    const addOption = () => {
        var _a, _b, _c;
        const next = [
            ...((_a = field.options) !== null && _a !== void 0 ? _a : []),
            {
                value: `option-${((_c = (_b = field.options) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) + 1}`,
                label: "New option",
            },
        ];
        update({ options: next });
    };
    const updateOption = (idx, patch) => {
        var _a;
        const next = ((_a = field.options) !== null && _a !== void 0 ? _a : []).map((o, i) => i === idx ? Object.assign(Object.assign({}, o), patch) : o);
        update({ options: next });
    };
    const removeOption = (idx) => {
        var _a;
        const next = ((_a = field.options) !== null && _a !== void 0 ? _a : []).filter((_, i) => i !== idx);
        update({ options: next });
    };
    const addValidation = (kind) => {
        var _a;
        const defaults = {
            required: { kind: "required" },
            min: { kind: "min", value: 0 },
            max: { kind: "max", value: 0 },
            minLength: { kind: "minLength", value: 1 },
            maxLength: { kind: "maxLength", value: 255 },
            pattern: { kind: "pattern", value: ".*" },
            email: { kind: "email" },
            url: { kind: "url" },
            equals: { kind: "equals", value: "" },
            custom: { kind: "custom" },
        };
        update({
            validationRules: [...((_a = field.validationRules) !== null && _a !== void 0 ? _a : []), defaults[kind]],
        });
    };
    const removeValidation = (idx) => {
        var _a;
        const next = ((_a = field.validationRules) !== null && _a !== void 0 ? _a : []).filter((_, i) => i !== idx);
        update({ validationRules: next });
    };
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Field" }), _jsxs("div", { className: "flex items-center gap-1", children: [onMoveUp ? (_jsx("button", { type: "button", onClick: onMoveUp, className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] px-2 py-1", "aria-label": "Move up", children: "\u2191" })) : null, onMoveDown ? (_jsx("button", { type: "button", onClick: onMoveDown, className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] px-2 py-1", "aria-label": "Move down", children: "\u2193" })) : null, _jsx("button", { type: "button", onClick: onDelete, className: "text-xs text-red-400 hover:text-red-300 px-2 py-1", children: "Remove" })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Label" }), _jsx("input", { value: field.label, onChange: (e) => update({ label: e.target.value }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Key" }), _jsx("input", { value: field.fieldKey, onChange: (e) => update({
                                    fieldKey: e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9_]+/g, "_"),
                                }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm font-mono" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Type" }), _jsx("select", { value: String(field.fieldType), onChange: (e) => update({ fieldType: e.target.value }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm", children: FIELD_TYPES.map((t) => {
                                    var _a;
                                    return (_jsx("option", { value: t, children: (_a = TYPE_LABELS[t]) !== null && _a !== void 0 ? _a : t }, t));
                                }) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Placeholder" }), _jsx("input", { value: (_a = field.placeholder) !== null && _a !== void 0 ? _a : "", onChange: (e) => update({ placeholder: e.target.value || null }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Help text" }), _jsx("input", { value: (_b = field.helpText) !== null && _b !== void 0 ? _b : "", onChange: (e) => update({ helpText: e.target.value || null }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: field.required === true, onChange: (e) => update({ required: e.target.checked }) }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: "Required" })] }), hasOptions ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Options" }), ((_c = field.options) !== null && _c !== void 0 ? _c : []).map((opt, idx) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: opt.label, placeholder: "Label", onChange: (e) => updateOption(idx, { label: e.target.value }), className: "flex-1 rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-1.5 text-sm" }), _jsx("input", { value: opt.value, placeholder: "Value", onChange: (e) => updateOption(idx, { value: e.target.value }), className: "w-40 rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-1.5 text-sm font-mono" }), _jsx("button", { type: "button", onClick: () => removeOption(idx), className: "text-xs text-red-400 hover:text-red-300 px-2 py-1", children: "\u00D7" })] }, idx))), _jsx("button", { type: "button", onClick: addOption, className: "text-xs text-[#00ff88] hover:text-[#00e679]", children: "+ Add option" })] })) : null, _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Validation" }), _jsxs("select", { onChange: (e) => {
                                    if (e.target.value) {
                                        addValidation(e.target.value);
                                        e.target.value = "";
                                    }
                                }, defaultValue: "", className: "rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-2 py-1 text-xs", children: [_jsx("option", { value: "", children: "+ Add rule" }), _jsx("option", { value: "required", children: "required" }), _jsx("option", { value: "minLength", children: "minLength" }), _jsx("option", { value: "maxLength", children: "maxLength" }), _jsx("option", { value: "min", children: "min" }), _jsx("option", { value: "max", children: "max" }), _jsx("option", { value: "pattern", children: "pattern" }), _jsx("option", { value: "email", children: "email" }), _jsx("option", { value: "url", children: "url" }), _jsx("option", { value: "equals", children: "equals" })] })] }), ((_d = field.validationRules) !== null && _d !== void 0 ? _d : []).map((rule, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)] font-mono", children: [_jsxs("span", { className: "px-2 py-1 bg-[var(--z-surface-2)] rounded border border-[var(--z-border)]", children: [rule.kind, rule.value !== undefined && rule.value !== null
                                        ? `: ${String(rule.value)}`
                                        : ""] }), _jsx("button", { type: "button", onClick: () => removeValidation(idx), className: "text-red-400 hover:text-red-300", children: "\u00D7" })] }, idx)))] })] }));
}
