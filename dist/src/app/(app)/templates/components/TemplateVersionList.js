import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toLocaleString();
}
export function TemplateVersionList({ versions, emptyLabel = "No version history yet.", }) {
    if (versions.length === 0) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    return (_jsx("ol", { className: "space-y-2", children: versions.map((v) => (_jsxs("li", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-[var(--z-border)] px-2 text-xs font-semibold text-[var(--z-fg)]", children: ["v", v.version] }), v.isCurrent ? (_jsx("span", { className: "rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] px-2 py-0.5 text-xs font-semibold text-[var(--z-accent)]", children: "current" })) : null] }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: formatDate(v.createdAt) })] }), v.changeSummary ? (_jsx("div", { className: "mt-2 text-sm text-[var(--z-fg)]/80", children: v.changeSummary })) : null] }, v.id))) }));
}
