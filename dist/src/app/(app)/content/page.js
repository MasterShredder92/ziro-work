import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getContentDashboard } from "@/lib/content";
import { CollectionList, ContentList, ContentSearch, ContentUploader, TagList, } from "./components";
import { resolveContentContext } from "./guard";
export const dynamic = "force-dynamic";
function Kpi({ label, value, sublabel, accent, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-2xl font-bold ${accent !== null && accent !== void 0 ? accent : "text-[var(--z-fg)]"}`, children: value }), sublabel ? (_jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: sublabel })) : null] }));
}
function Forbidden() {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view the content library." })] }));
}
export default async function ContentDashboardPage() {
    let ctx;
    try {
        ctx = await resolveContentContext();
    }
    catch (_a) {
        return _jsx(Forbidden, {});
    }
    const data = await getContentDashboard(ctx.tenantId);
    await logAudit("content.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        totalItems: data.kpis.totalItems,
        embeddingCoverage: data.kpis.embeddingCoveragePct,
        source: "page",
    });
    const kindsWithCounts = Object.entries(data.kpis.itemsByKind)
        .filter(([, count]) => count > 0)
        .map(([kind, count]) => `${kind} ${count}`)
        .join(" · ");
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Content OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Content Library" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(Kpi, { label: "Items", value: data.kpis.totalItems, sublabel: kindsWithCounts || "No items yet" }), _jsx(Kpi, { label: "Tags", value: data.kpis.totalTags, sublabel: data.kpis.mostUsedTags[0]
                                    ? `Top: ${data.kpis.mostUsedTags[0].label}`
                                    : undefined }), _jsx(Kpi, { label: "Collections", value: data.kpis.totalCollections }), _jsx(Kpi, { label: "Indexed", value: `${data.kpis.embeddingCoveragePct}%`, sublabel: `${data.kpis.itemsWithEmbeddings}/${data.kpis.totalItems} embedded`, accent: "text-[#00ff88]" })] })] }), _jsxs("section", { id: "search", className: "space-y-2 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Search" }), _jsx(ContentSearch, { tenantId: ctx.tenantId })] }), _jsxs("section", { id: "library", className: "space-y-2 scroll-mt-24", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Most accessed" }), _jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: [data.items.length, " total"] })] }), _jsx(ContentList, { items: data.items.slice(0, 20) })] }), _jsxs("section", { id: "collections", className: "space-y-2 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Collections" }), _jsx(CollectionList, { collections: data.collections })] }), _jsxs("section", { id: "tags", className: "space-y-2 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Tags" }), _jsx(TagList, { tags: data.tags, usageBySlug: new Map(data.kpis.mostUsedTags.map((t) => [t.slug, t.usageCount])) })] }), ctx.canWrite ? (_jsxs("section", { id: "upload", className: "space-y-2 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Upload" }), _jsx(ContentUploader, { tenantId: ctx.tenantId })] })) : null] }));
}
