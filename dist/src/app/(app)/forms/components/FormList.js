import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatPct(n) {
    if (!Number.isFinite(n))
        return "–";
    return `${(n * 100).toFixed(0)}%`;
}
function formatRelative(iso) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime()))
            return "–";
        const diff = Date.now() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return "just now";
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    catch (_a) {
        return "–";
    }
}
export function FormList({ forms, submissionsByForm, kpis }) {
    if (forms.length === 0) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "No forms yet" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Create your first form to start collecting responses." })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [_jsx(KpiCard, { label: "Forms", value: String(kpis.totalForms) }), _jsx(KpiCard, { label: "Published", value: String(kpis.publishedForms) }), _jsx(KpiCard, { label: "Submissions", value: String(kpis.totalSubmissions) }), _jsx(KpiCard, { label: "Completion", value: formatPct(kpis.completionRate), tone: "positive" })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left", children: [_jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Form" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Status" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Public" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)] text-right", children: "Submissions" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)] text-right", children: "Updated" })] }) }), _jsx("tbody", { children: forms.map((form) => {
                                var _a;
                                return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/[0.02]", children: [_jsxs("td", { className: "px-4 py-2", children: [_jsx(Link, { href: `/forms/${form.id}`, className: "text-[var(--z-fg)] font-medium hover:text-[#00ff88]", children: form.name }), form.slug ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)] font-mono", children: ["/", form.slug] })) : null] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)] capitalize", children: form.status }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: form.isPublic ? "Yes" : "No" }), _jsx("td", { className: "px-4 py-2 text-right font-mono text-[var(--z-fg)]", children: (_a = submissionsByForm[form.id]) !== null && _a !== void 0 ? _a : 0 }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-muted)]", children: formatRelative(form.updatedAt) })] }, form.id));
                            }) })] }) })] }));
}
function KpiCard({ label, value, tone, }) {
    const toneClass = tone === "positive"
        ? "text-[#00ff88]"
        : tone === "warning"
            ? "text-amber-400"
            : "text-[var(--z-fg)]";
    return (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-lg font-semibold ${toneClass}`, children: value })] }));
}
