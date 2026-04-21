"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
export function PermissionMatrix({ bundles, roles, canWrite, onToggle, }) {
    const [filter, setFilter] = useState("");
    const lower = filter.trim().toLowerCase();
    const filteredBundles = useMemo(() => {
        if (!lower)
            return bundles;
        return bundles
            .map((b) => (Object.assign(Object.assign({}, b), { permissions: b.permissions.filter((p) => p.toLowerCase().includes(lower) || b.label.toLowerCase().includes(lower)) })))
            .filter((b) => b.permissions.length > 0);
    }, [bundles, lower]);
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("input", { type: "search", value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Filter permissions\u2026", className: "h-9 w-full max-w-sm rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]" }) }), _jsx("div", { className: "overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]", children: _jsxs("table", { className: "min-w-full border-collapse text-sm", children: [_jsx("thead", { className: "bg-[var(--z-surface)] text-left text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "sticky left-0 z-10 bg-[var(--z-surface)] px-3 py-2 font-semibold", children: "Permission" }), roles.map((r) => (_jsxs("th", { className: "px-3 py-2 font-semibold whitespace-nowrap", children: [r.role.name, _jsx("div", { className: "text-[10px] font-normal text-[var(--z-muted)]", children: r.role.key })] }, r.role.id)))] }) }), _jsxs("tbody", { children: [filteredBundles.map((bundle) => (_jsx(BundleRows, { bundle: bundle, roles: roles, canWrite: canWrite, onToggle: onToggle }, bundle.key))), filteredBundles.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: roles.length + 1, className: "px-3 py-6 text-center text-[var(--z-muted)]", children: "No permissions match your filter." }) })) : null] })] }) })] }));
}
function BundleRows({ bundle, roles, canWrite, onToggle, }) {
    return (_jsxs(_Fragment, { children: [_jsx("tr", { className: "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-fg)]", children: _jsx("td", { className: "sticky left-0 z-10 bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-3 py-2 font-semibold", colSpan: roles.length + 1, children: bundle.label }) }), bundle.permissions.map((permission) => (_jsxs("tr", { className: "border-t border-[var(--z-border)]", children: [_jsx("td", { className: "sticky left-0 z-10 bg-[var(--z-bg)] px-3 py-2 font-mono text-xs text-[var(--z-muted)]", children: permission }), roles.map((r) => {
                        const has = r.effectivePermissions.includes(permission);
                        return (_jsx("td", { className: "px-3 py-2", children: _jsx("input", { type: "checkbox", checked: has, disabled: !canWrite || r.role.is_system, onChange: (e) => onToggle === null || onToggle === void 0 ? void 0 : onToggle(r.role.id, permission, e.target.checked), "aria-label": `${r.role.name} / ${permission}` }) }, r.role.id));
                    })] }, permission)))] }));
}
