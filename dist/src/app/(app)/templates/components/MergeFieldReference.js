import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const GROUP_LABELS = {
    student: "Student",
    family: "Family",
    teacher: "Teacher",
    lesson: "Lesson",
    tenant: "Tenant",
    custom: "Custom",
};
export function MergeFieldReference({ mergeFields, missing, }) {
    const groups = mergeFields.reduce((acc, f) => {
        var _a;
        const key = (_a = f.group) !== null && _a !== void 0 ? _a : "custom";
        if (!acc[key])
            acc[key] = [];
        acc[key].push(f);
        return acc;
    }, {});
    const groupKeys = Object.keys(groups).sort();
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Available merge fields" }), missing && missing.length > 0 ? (_jsxs("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_50%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-3 text-sm text-[var(--z-danger)]", children: [_jsx("div", { className: "font-semibold", children: "Unresolved fields in last render:" }), _jsx("ul", { className: "mt-1 list-disc pl-5 text-xs", children: missing.map((m) => (_jsx("li", { children: _jsx("code", { children: `{{${m}}}` }) }, m))) })] })) : null, _jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: groupKeys.map((key) => {
                    var _a;
                    return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: (_a = GROUP_LABELS[key]) !== null && _a !== void 0 ? _a : key }), _jsx("ul", { className: "space-y-2 text-sm", children: groups[key].map((f) => (_jsxs("li", { children: [_jsx("code", { className: "rounded bg-[color-mix(in_oklab,var(--z-surface),black_4%)] px-1.5 py-0.5 text-xs text-[var(--z-accent)]", children: `{{${f.path}}}` }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-fg)]/80", children: f.label }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: f.description })] }, f.path))) })] }, key));
                }) })] }));
}
