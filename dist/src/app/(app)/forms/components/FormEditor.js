"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORM_STATUSES } from "@/lib/forms/types";
import { FieldEditor, fieldFromRecord } from "./FieldEditor";
import { FormPreview } from "./FormPreview";
function initialFormState(form) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        name: (_a = form === null || form === void 0 ? void 0 : form.name) !== null && _a !== void 0 ? _a : "",
        slug: (_b = form === null || form === void 0 ? void 0 : form.slug) !== null && _b !== void 0 ? _b : "",
        description: (_c = form === null || form === void 0 ? void 0 : form.description) !== null && _c !== void 0 ? _c : "",
        status: (_d = form === null || form === void 0 ? void 0 : form.status) !== null && _d !== void 0 ? _d : "draft",
        isPublic: (form === null || form === void 0 ? void 0 : form.isPublic) === true,
        submitLabel: (_e = form === null || form === void 0 ? void 0 : form.submitLabel) !== null && _e !== void 0 ? _e : "",
        successMessage: (_f = form === null || form === void 0 ? void 0 : form.successMessage) !== null && _f !== void 0 ? _f : "",
        successRedirectUrl: (_g = form === null || form === void 0 ? void 0 : form.successRedirectUrl) !== null && _g !== void 0 ? _g : "",
    };
}
function toEditableFields(fields) {
    return [...fields]
        .sort((a, b) => a.position - b.position)
        .map(fieldFromRecord);
}
function makeNewField(position) {
    return {
        id: `new-${Math.random().toString(36).slice(2, 10)}`,
        fieldKey: `field_${position + 1}`,
        label: "Untitled field",
        fieldType: "text",
        placeholder: null,
        helpText: null,
        required: false,
        position,
        options: [],
        validationRules: [],
        defaultValue: null,
        metadata: {},
    };
}
export function FormEditor({ initial, canWrite }) {
    var _a;
    const router = useRouter();
    const isEditing = initial.mode === "edit";
    const bundle = isEditing ? initial.bundle : null;
    const formId = (_a = bundle === null || bundle === void 0 ? void 0 : bundle.form.id) !== null && _a !== void 0 ? _a : null;
    const [state, setState] = useState(initialFormState(bundle === null || bundle === void 0 ? void 0 : bundle.form));
    const [fields, setFields] = useState(bundle ? toEditableFields(bundle.fields) : []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const update = (patch) => setState((s) => (Object.assign(Object.assign({}, s), patch)));
    const addField = () => setFields((fs) => [...fs, makeNewField(fs.length)]);
    const updateField = (idx, next) => setFields((fs) => fs.map((f, i) => (i === idx ? next : f)));
    const deleteField = (idx) => setFields((fs) => fs.filter((_, i) => i !== idx).map((f, i) => (Object.assign(Object.assign({}, f), { position: i }))));
    const moveField = (idx, dir) => setFields((fs) => {
        const next = [...fs];
        const j = idx + dir;
        if (j < 0 || j >= next.length)
            return fs;
        [next[idx], next[j]] = [next[j], next[idx]];
        return next.map((f, i) => (Object.assign(Object.assign({}, f), { position: i })));
    });
    const handleSave = async () => {
        var _a, _b;
        if (!canWrite)
            return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                form: {
                    name: state.name,
                    slug: state.slug || null,
                    description: state.description || null,
                    status: state.status,
                    isPublic: state.isPublic,
                    submitLabel: state.submitLabel || null,
                    successMessage: state.successMessage || null,
                    successRedirectUrl: state.successRedirectUrl || null,
                },
                fields: fields.map((f, i) => (Object.assign(Object.assign({}, f), { id: f.id.startsWith("new-") ? undefined : f.id, position: i }))),
            };
            const url = formId ? `/forms/api/${formId}` : "/forms/api/list";
            const method = formId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body === null || body === void 0 ? void 0 : body.error) !== null && _a !== void 0 ? _a : `Request failed (${res.status})`);
            }
            const body = (await res.json());
            router.push(formId ? `/forms/${formId}` : `/forms/${(_b = body.id) !== null && _b !== void 0 ? _b : ""}`);
            router.refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save form");
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!canWrite || !formId)
            return;
        if (!confirm("Delete this form and all its fields?"))
            return;
        setSaving(true);
        try {
            const res = await fetch(`/forms/api/${formId}`, { method: "DELETE" });
            if (!res.ok)
                throw new Error(`Delete failed (${res.status})`);
            router.push("/forms");
            router.refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete form");
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Name" }), _jsx("input", { value: state.name, onChange: (e) => update({ name: e.target.value }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Slug" }), _jsx("input", { value: state.slug, onChange: (e) => update({
                                                    slug: e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9-]+/g, "-"),
                                                }), placeholder: "intake-form", className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm font-mono" })] })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Description" }), _jsx("textarea", { value: state.description, onChange: (e) => update({ description: e.target.value }), rows: 2, className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Status" }), _jsx("select", { value: state.status, onChange: (e) => update({ status: e.target.value }), className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm capitalize", children: FORM_STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) })] }), _jsxs("label", { className: "flex items-end gap-2 pb-1", children: [_jsx("input", { type: "checkbox", checked: state.isPublic, onChange: (e) => update({ isPublic: e.target.checked }) }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: "Public" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Submit label" }), _jsx("input", { value: state.submitLabel, onChange: (e) => update({ submitLabel: e.target.value }), placeholder: "Submit", className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Redirect URL" }), _jsx("input", { value: state.successRedirectUrl, onChange: (e) => update({ successRedirectUrl: e.target.value }), placeholder: "https://\u2026", className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Thank-you message" }), _jsx("textarea", { value: state.successMessage, onChange: (e) => update({ successMessage: e.target.value }), rows: 2, className: "mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Fields" }), canWrite ? (_jsx("button", { type: "button", onClick: addField, className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/5", children: "+ Add field" })) : null] }), _jsx("div", { className: "space-y-3", children: fields.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]", children: "No fields yet \u2014 add one to get started." })) : (fields.map((f, idx) => (_jsx(FieldEditor, { field: f, onUpdate: (next) => updateField(idx, next), onDelete: () => deleteField(idx), onMoveUp: idx > 0 ? () => moveField(idx, -1) : undefined, onMoveDown: idx < fields.length - 1
                                ? () => moveField(idx, 1)
                                : undefined }, f.id)))) }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300", children: error })) : null, _jsxs("div", { className: "flex items-center justify-between gap-2", children: [isEditing && canWrite ? (_jsx("button", { type: "button", onClick: handleDelete, disabled: saving, className: "rounded-[var(--z-radius-md)] border border-red-500/40 bg-transparent px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60", children: "Delete form" })) : (_jsx("span", {})), _jsx("button", { type: "button", onClick: handleSave, disabled: !canWrite || saving || !state.name.trim(), className: "rounded-[var(--z-radius-md)] bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm hover:bg-[#00e679] disabled:opacity-60", children: saving ? "Saving…" : isEditing ? "Save changes" : "Create form" })] })] }), _jsxs("div", { className: "xl:sticky xl:top-4 space-y-3", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Preview" }), _jsx(FormPreview, { form: {
                            name: state.name,
                            description: state.description,
                            submitLabel: state.submitLabel,
                        }, fields: fields.map((f) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                            return ({
                                id: f.id,
                                tenantId: (_a = bundle === null || bundle === void 0 ? void 0 : bundle.form.tenantId) !== null && _a !== void 0 ? _a : "",
                                formId: (_b = bundle === null || bundle === void 0 ? void 0 : bundle.form.id) !== null && _b !== void 0 ? _b : "",
                                sectionId: (_c = f.sectionId) !== null && _c !== void 0 ? _c : null,
                                sectionTitle: (_d = f.sectionTitle) !== null && _d !== void 0 ? _d : null,
                                fieldKey: f.fieldKey,
                                label: f.label,
                                fieldType: f.fieldType,
                                placeholder: (_e = f.placeholder) !== null && _e !== void 0 ? _e : null,
                                helpText: (_f = f.helpText) !== null && _f !== void 0 ? _f : null,
                                required: f.required === true,
                                position: typeof f.position === "number" ? f.position : 0,
                                options: (_g = f.options) !== null && _g !== void 0 ? _g : [],
                                validationRules: (_h = f.validationRules) !== null && _h !== void 0 ? _h : [],
                                defaultValue: (_j = f.defaultValue) !== null && _j !== void 0 ? _j : null,
                                metadata: (_k = f.metadata) !== null && _k !== void 0 ? _k : {},
                                createdAt: "",
                                updatedAt: "",
                            });
                        }) })] })] }));
}
