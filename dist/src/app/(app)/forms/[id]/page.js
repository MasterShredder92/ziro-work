import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getFormSurface } from "@/lib/forms/service";
import { FormEditor, SubmissionList } from "../components";
export const dynamic = "force-dynamic";
function pct(n) {
    return `${Math.round(n * 100)}%`;
}
export default async function FormDetailPage({ params }) {
    const { id } = await params;
    const session = await getSession();
    const canWrite = session ? can(session.role, "forms.write") : false;
    if (id === "new") {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Forms & surveys" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "New form" })] }), _jsx(FormEditor, { initial: { mode: "create" }, canWrite: canWrite })] }));
    }
    const surface = await getFormSurface(id);
    if (!surface)
        notFound();
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Forms & surveys" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: surface.form.name })] }), _jsx(FormEditor, { initial: {
                    mode: "edit",
                    bundle: {
                        form: surface.form,
                        fields: surface.fields,
                        sections: surface.sections,
                    },
                }, canWrite: canWrite }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "KPIs" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5", children: [_jsx(KpiCard, { label: "Submissions", value: surface.kpis.totalSubmissions }), _jsx(KpiCard, { label: "Completed", value: surface.kpis.completedSubmissions }), _jsx(KpiCard, { label: "Abandoned", value: surface.kpis.abandonedSubmissions }), _jsx(KpiCard, { label: "Completion rate", value: pct(surface.kpis.completionRate) }), _jsx(KpiCard, { label: "Avg duration", value: surface.kpis.averageDurationMs != null
                                    ? `${Math.round(surface.kpis.averageDurationMs / 1000)}s`
                                    : "—" })] })] }), surface.kpis.fieldDropOff.length > 0 ? (_jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Field drop-off" }), _jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Field" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Answered" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Drop-off" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Rate" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: surface.kpis.fieldDropOff.map((row) => (_jsxs("tr", { children: [_jsxs("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: [row.label, _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: row.fieldKey })] }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)]", children: row.answeredCount }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)]", children: row.dropOffCount }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)]", children: pct(row.dropOffRate) })] }, row.fieldId))) })] }) })] })) : null, _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Submissions" }), _jsx(SubmissionList, { submissions: surface.submissions })] })] }));
}
function KpiCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
