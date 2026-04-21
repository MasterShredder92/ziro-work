"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const GROUP_LABELS = {
    student: "Student (Progress OS)",
    family: "Family (CRM OS)",
    teacher: "Teacher (CRM OS)",
    lesson: "Lesson (Messaging OS)",
    tenant: "Workspace",
    custom: "Custom",
};
export function MergeFieldBrowser({ mergeFields, missing, onInsert, }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return mergeFields;
        return mergeFields.filter((f) => f.path.toLowerCase().includes(q) ||
            f.label.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q));
    }, [mergeFields, query]);
    const groups = useMemo(() => {
        return filtered.reduce((acc, f) => {
            var _a;
            const key = (_a = f.group) !== null && _a !== void 0 ? _a : "custom";
            if (!acc[key])
                acc[key] = [];
            acc[key].push(f);
            return acc;
        }, {});
    }, [filtered]);
    const groupKeys = Object.keys(groups).sort();
    const missingSet = new Set(missing !== null && missing !== void 0 ? missing : []);
    return (_jsxs("div", { className: "space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Merge fields" }), _jsx("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search\u2026", className: "w-36 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), missing && missing.length > 0 ? (_jsxs("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_50%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]", children: [_jsx("div", { className: "font-semibold", children: "Unresolved in last render:" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: missing.map((m) => (_jsx("code", { className: "rounded bg-[color-mix(in_oklab,var(--z-danger),transparent_80%)] px-1.5 py-0.5", children: `{{${m}}}` }, m))) })] })) : null, _jsxs("div", { className: "max-h-[400px] space-y-3 overflow-y-auto", children: [groupKeys.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "No matches." })) : null, groupKeys.map((key) => {
                        var _a;
                        return (_jsxs("div", { children: [_jsx("div", { className: "mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: (_a = GROUP_LABELS[key]) !== null && _a !== void 0 ? _a : key }), _jsx("ul", { className: "space-y-1", children: groups[key].map((f) => {
                                        const token = `{{${f.path}}}`;
                                        const isMissing = missingSet.has(f.path);
                                        return (_jsxs("li", { className: `rounded-md border px-2 py-1.5 text-xs ${isMissing
                                                ? "border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)]"
                                                : "border-[var(--z-border)] bg-[var(--z-surface-2)]"}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("code", { className: "truncate text-[var(--z-accent)]", children: token }), onInsert ? (_jsx("button", { type: "button", onClick: () => onInsert(token), className: "shrink-0 rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: "Insert" })) : null] }), _jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-fg)]/80", children: f.label }), f.description ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: f.description })) : null] }, f.path));
                                    }) })] }, key));
                    })] })] }));
}
