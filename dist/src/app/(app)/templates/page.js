import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { listMergeFields, listTemplatesForTenant, } from "@/lib/templates/service";
import { MergeFieldReference } from "./components/MergeFieldReference";
import { TemplateList } from "./components/TemplateList";
export default async function TemplatesOverviewPage() {
    try {
        await requirePermission("templates.read")();
    }
    catch (_a) {
        redirect("/");
    }
    const [templates, mergeFields] = await Promise.all([
        listTemplatesForTenant(),
        listMergeFields(),
    ]);
    const byCategory = templates.reduce((acc, t) => {
        var _a;
        acc[t.category] = ((_a = acc[t.category]) !== null && _a !== void 0 ? _a : 0) + 1;
        return acc;
    }, {});
    const byChannel = templates.reduce((acc, t) => {
        var _a;
        acc[t.channel] = ((_a = acc[t.channel]) !== null && _a !== void 0 ? _a : 0) + 1;
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Communication Templates" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Manage reusable, versioned templates with merge fields for every family-, student-, and teacher-facing message." })] }), _jsx(Link, { href: "/templates/new", className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-2 text-sm font-semibold text-[var(--z-accent)]", children: "New template" })] }), _jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(SummaryCard, { label: "Total templates", value: String(templates.length) }), _jsx(SummaryCard, { label: "Categories", value: String(Object.keys(byCategory).length) }), _jsx(SummaryCard, { label: "Channels", value: String(Object.keys(byChannel).length) }), _jsx(SummaryCard, { label: "Archived", value: String(templates.filter((t) => t.isArchived).length) })] }), _jsxs("section", { id: "library", className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Library" }), _jsx(TemplateList, { templates: templates })] }), _jsxs("section", { id: "merge-fields", className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Merge field reference" }), _jsx(MergeFieldReference, { mergeFields: mergeFields })] })] }));
}
function SummaryCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
