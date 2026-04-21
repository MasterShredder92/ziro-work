import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getFormsDashboard } from "@/lib/forms/service";
import { FormList, SubmissionList } from "./components";
export const dynamic = "force-dynamic";
function pct(n) {
    return `${Math.round(n * 100)}%`;
}
export default async function FormsPage() {
    const dashboard = await getFormsDashboard();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "flex flex-wrap items-end justify-between gap-3", children: _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Forms & surveys" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Forms dashboard" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Design dynamic forms, collect submissions, and trigger automations on every new response." })] }) }), _jsxs("section", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5", children: [_jsx(KpiCard, { label: "Total forms", value: dashboard.kpis.totalForms }), _jsx(KpiCard, { label: "Published", value: dashboard.kpis.publishedForms }), _jsx(KpiCard, { label: "Drafts", value: dashboard.kpis.draftForms }), _jsx(KpiCard, { label: "Total submissions", value: dashboard.kpis.totalSubmissions }), _jsx(KpiCard, { label: "Completion rate", value: pct(dashboard.kpis.completionRate) })] }), _jsxs("section", { id: "library", className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Form library" }), _jsx(FormList, { forms: dashboard.forms, submissionsByForm: dashboard.submissionsByForm, kpis: dashboard.kpis })] }), _jsxs("section", { id: "submissions", className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Recent submissions" }), _jsx(SubmissionList, { submissions: dashboard.recentSubmissions })] })] }));
}
function KpiCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
