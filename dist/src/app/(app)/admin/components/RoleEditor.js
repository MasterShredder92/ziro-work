"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const BASE_ROLES = [
    { key: "admin", label: "Admin" },
    { key: "director", label: "Director" },
    { key: "teacher", label: "Teacher" },
    { key: "student", label: "Student" },
    { key: "family", label: "Family" },
];
export function RoleEditor({ tenantId, initial, bundles, availableRoles, canWrite, onSaved, onDeleted, }) {
    var _a, _b, _c, _d, _e, _f;
    const [key, setKey] = useState((_a = initial === null || initial === void 0 ? void 0 : initial.key) !== null && _a !== void 0 ? _a : "");
    const [name, setName] = useState((_b = initial === null || initial === void 0 ? void 0 : initial.name) !== null && _b !== void 0 ? _b : "");
    const [description, setDescription] = useState((_c = initial === null || initial === void 0 ? void 0 : initial.description) !== null && _c !== void 0 ? _c : "");
    const [baseRole, setBaseRole] = useState((_d = initial === null || initial === void 0 ? void 0 : initial.base_role) !== null && _d !== void 0 ? _d : "");
    const [inheritsFrom, setInheritsFrom] = useState((_e = initial === null || initial === void 0 ? void 0 : initial.inherits_from) !== null && _e !== void 0 ? _e : "");
    const [permissions, setPermissions] = useState(new Set((_f = initial === null || initial === void 0 ? void 0 : initial.permissions) !== null && _f !== void 0 ? _f : []));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const disabled = !canWrite || (initial === null || initial === void 0 ? void 0 : initial.is_system) === true;
    const allPermissions = useMemo(() => Array.from(new Set(bundles.flatMap((b) => b.permissions))).sort(), [bundles]);
    function togglePermission(p) {
        const next = new Set(permissions);
        if (next.has(p))
            next.delete(p);
        else
            next.add(p);
        setPermissions(next);
    }
    function toggleBundle(bundle, nextOn) {
        const next = new Set(permissions);
        for (const p of bundle.permissions) {
            if (nextOn)
                next.add(p);
            else
                next.delete(p);
        }
        setPermissions(next);
    }
    async function save() {
        var _a;
        setSaving(true);
        setError(null);
        try {
            const body = {
                key: key.trim() || undefined,
                name: name.trim() || undefined,
                description: description || null,
                base_role: (baseRole || null),
                inherits_from: inheritsFrom || null,
                permissions: Array.from(permissions).sort(),
            };
            const url = initial
                ? `/api/admin/roles/${initial.id}?tenantId=${encodeURIComponent(tenantId)}`
                : `/api/admin/roles?tenantId=${encodeURIComponent(tenantId)}`;
            const method = initial ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = (await res.json().catch(() => null));
            if (!res.ok)
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            if (data === null || data === void 0 ? void 0 : data.data)
                onSaved === null || onSaved === void 0 ? void 0 : onSaved(data.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save role");
        }
        finally {
            setSaving(false);
        }
    }
    async function remove() {
        var _a;
        if (!initial)
            return;
        if (!confirm(`Delete role "${initial.name}"? This cannot be undone.`)) {
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/roles/${initial.id}?tenantId=${encodeURIComponent(tenantId)}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) {
                const data = (await res.json().catch(() => null));
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            onDeleted === null || onDeleted === void 0 ? void 0 : onDeleted(initial.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete role");
        }
        finally {
            setSaving(false);
        }
    }
    const filterableRoles = availableRoles.filter((r) => !initial || r.id !== initial.id);
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsx(Field, { label: "Key", children: _jsx("input", { value: key, onChange: (e) => setKey(e.target.value), disabled: disabled, className: "h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm", placeholder: "e.g. studio-lead" }) }), _jsx(Field, { label: "Name", children: _jsx("input", { value: name, onChange: (e) => setName(e.target.value), disabled: disabled, className: "h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm", placeholder: "Display name" }) })] }), _jsx(Field, { label: "Description", children: _jsx("textarea", { value: description !== null && description !== void 0 ? description : "", onChange: (e) => setDescription(e.target.value), disabled: disabled, rows: 2, className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm" }) }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsx(Field, { label: "Base role (inherits system perms)", children: _jsxs("select", { value: baseRole, onChange: (e) => setBaseRole(e.target.value), disabled: disabled, className: "h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm", children: [_jsx("option", { value: "", children: "None" }), BASE_ROLES.map((r) => (_jsx("option", { value: r.key, children: r.label }, r.key)))] }) }), _jsx(Field, { label: "Inherits from role", children: _jsxs("select", { value: inheritsFrom !== null && inheritsFrom !== void 0 ? inheritsFrom : "", onChange: (e) => setInheritsFrom(e.target.value), disabled: disabled, className: "h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm", children: [_jsx("option", { value: "", children: "None" }), filterableRoles.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] }) })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: ["Permissions (", permissions.size, "/", allPermissions.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: bundles.map((bundle) => {
                            const allOn = bundle.permissions.every((p) => permissions.has(p));
                            const someOn = bundle.permissions.some((p) => permissions.has(p));
                            return (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] p-3", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-semibold", children: bundle.label }), _jsxs("label", { className: "flex items-center gap-1 text-xs text-[var(--z-muted)]", children: [_jsx("input", { type: "checkbox", checked: allOn, ref: (el) => {
                                                            if (el)
                                                                el.indeterminate = !allOn && someOn;
                                                        }, disabled: disabled, onChange: (e) => toggleBundle(bundle, e.target.checked) }), "all"] })] }), _jsx("div", { className: "flex flex-col gap-1", children: bundle.permissions.map((p) => (_jsxs("label", { className: "flex items-center gap-2 font-mono text-xs text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", checked: permissions.has(p), disabled: disabled, onChange: () => togglePermission(p) }), p] }, p))) })] }, bundle.key));
                        }) })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400", children: error })) : null, _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: save, disabled: disabled || saving, className: "h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50", children: saving ? "Saving…" : initial ? "Save changes" : "Create role" }), initial && !initial.is_system ? (_jsx("button", { type: "button", onClick: remove, disabled: disabled || saving, className: "h-9 rounded-[var(--z-radius-md)] border border-red-500/40 px-4 text-sm text-red-400 disabled:opacity-50", children: "Delete role" })) : null, (initial === null || initial === void 0 ? void 0 : initial.is_system) ? (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "System roles are read-only." })) : null] })] }));
}
function Field({ label, children, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), children] }));
}
