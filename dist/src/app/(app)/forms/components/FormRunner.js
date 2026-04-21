"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
function initialValues(fields) {
    const out = {};
    for (const f of fields) {
        if (f.defaultValue !== undefined && f.defaultValue !== null) {
            out[f.fieldKey] = f.defaultValue;
        }
        else if (f.fieldType === "multiselect") {
            out[f.fieldKey] = [];
        }
        else if (f.fieldType === "boolean" || f.fieldType === "checkbox") {
            out[f.fieldKey] = false;
        }
        else {
            out[f.fieldKey] = "";
        }
    }
    return out;
}
export function FormRunner({ form, fields }) {
    const router = useRouter();
    const orderedFields = useMemo(() => [...fields].sort((a, b) => a.position - b.position), [fields]);
    const [values, setValues] = useState(() => initialValues(orderedFields));
    const [issues, setIssues] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const setValue = (key, value) => setValues((v) => (Object.assign(Object.assign({}, v), { [key]: value })));
    const handleSubmit = async (e) => {
        var _a, _b, _c, _d, _e, _f, _g;
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setIssues([]);
        try {
            const answers = orderedFields.map((f) => ({
                fieldId: f.id,
                fieldKey: f.fieldKey,
                label: f.label,
                value: values[f.fieldKey],
            }));
            const res = await fetch("/forms/api/run", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    formId: form.id,
                    tenantId: form.tenantId,
                    answers,
                }),
            });
            const body = (await res.json().catch(() => ({})));
            if (!res.ok) {
                if ((_b = (_a = body === null || body === void 0 ? void 0 : body.validation) === null || _a === void 0 ? void 0 : _a.issues) === null || _b === void 0 ? void 0 : _b.length) {
                    setIssues(body.validation.issues);
                    return;
                }
                throw new Error((_c = body === null || body === void 0 ? void 0 : body.error) !== null && _c !== void 0 ? _c : `Submission failed (${res.status})`);
            }
            if ((_e = (_d = body.validation) === null || _d === void 0 ? void 0 : _d.issues) === null || _e === void 0 ? void 0 : _e.length) {
                setIssues(body.validation.issues);
                return;
            }
            if (body.redirectUrl) {
                window.location.href = body.redirectUrl;
                return;
            }
            setSuccess((_g = (_f = body.message) !== null && _f !== void 0 ? _f : form.successMessage) !== null && _g !== void 0 ? _g : "Thanks! Your response was recorded.");
            setValues(initialValues(orderedFields));
            router.refresh();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Submission failed");
        }
        finally {
            setSubmitting(false);
        }
    };
    const issueByField = new Map();
    for (const i of issues) {
        if (i.fieldKey)
            issueByField.set(i.fieldKey, i);
    }
    if (success) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[#00ff88]/40 bg-[#00ff88]/5 p-6 text-center space-y-2", children: [_jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Thank you!" }), _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: success })] }));
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: form.name }), form.description ? (_jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: form.description })) : null] }), _jsx("div", { className: "space-y-3", children: orderedFields.map((field) => {
                    const issue = issueByField.get(field.fieldKey);
                    const labelEl = (_jsxs("label", { className: "text-sm font-medium text-[var(--z-fg)]", children: [field.label, field.required ? (_jsx("span", { className: "text-red-400 ml-1", children: "*" })) : null] }));
                    return (_jsxs("div", { className: "space-y-1", children: [labelEl, renderInput(field, values[field.fieldKey], (v) => setValue(field.fieldKey, v)), field.helpText ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: field.helpText })) : null, issue ? (_jsx("div", { className: "text-xs text-red-400", children: issue.message })) : null] }, field.id));
                }) }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300", children: error })) : null, _jsx("button", { type: "submit", disabled: submitting, className: "rounded-[var(--z-radius-md)] bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm hover:bg-[#00e679] disabled:opacity-60", children: submitting ? "Submitting…" : form.submitLabel || "Submit" })] }));
}
function renderInput(field, value, onChange) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const inputCls = "w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm";
    const ftype = String(field.fieldType);
    const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);
    switch (ftype) {
        case "textarea":
            return (_jsx("textarea", { rows: 4, value: stringValue, placeholder: (_a = field.placeholder) !== null && _a !== void 0 ? _a : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "select":
            return (_jsxs("select", { value: stringValue, onChange: (e) => onChange(e.target.value), className: inputCls, children: [_jsx("option", { value: "", children: (_b = field.placeholder) !== null && _b !== void 0 ? _b : "Choose…" }), ((_c = field.options) !== null && _c !== void 0 ? _c : []).map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value)))] }));
        case "radio":
            return (_jsx("div", { className: "space-y-1", children: ((_d = field.options) !== null && _d !== void 0 ? _d : []).map((o) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "radio", name: field.fieldKey, value: o.value, checked: stringValue === o.value, onChange: () => onChange(o.value) }), o.label] }, o.value))) }));
        case "multiselect": {
            const arr = Array.isArray(value) ? value : [];
            return (_jsx("div", { className: "space-y-1", children: ((_e = field.options) !== null && _e !== void 0 ? _e : []).map((o) => {
                    const checked = arr.includes(o.value);
                    return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => {
                                    if (e.target.checked)
                                        onChange([...arr, o.value]);
                                    else
                                        onChange(arr.filter((v) => v !== o.value));
                                } }), o.label] }, o.value));
                }) }));
        }
        case "boolean":
        case "checkbox":
            return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: value === true, onChange: (e) => onChange(e.target.checked) }), (_f = field.placeholder) !== null && _f !== void 0 ? _f : "Confirm"] }));
        case "date":
            return (_jsx("input", { type: "date", value: stringValue, onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "datetime":
            return (_jsx("input", { type: "datetime-local", value: stringValue, onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "number":
        case "rating":
            return (_jsx("input", { type: "number", value: stringValue, placeholder: (_g = field.placeholder) !== null && _g !== void 0 ? _g : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "email":
            return (_jsx("input", { type: "email", value: stringValue, placeholder: (_h = field.placeholder) !== null && _h !== void 0 ? _h : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "phone":
            return (_jsx("input", { type: "tel", value: stringValue, placeholder: (_j = field.placeholder) !== null && _j !== void 0 ? _j : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "url":
            return (_jsx("input", { type: "url", value: stringValue, placeholder: (_k = field.placeholder) !== null && _k !== void 0 ? _k : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
        case "hidden":
            return (_jsx("input", { type: "hidden", value: stringValue, onChange: (e) => onChange(e.target.value) }));
        default:
            return (_jsx("input", { type: "text", value: stringValue, placeholder: (_l = field.placeholder) !== null && _l !== void 0 ? _l : "", onChange: (e) => onChange(e.target.value), className: inputCls }));
    }
}
