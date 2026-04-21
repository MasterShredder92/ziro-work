import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getFolder, listContentItems, listFolders, listTags } from "@/lib/content";
import { ContentList, TagList } from "../../components";
import { resolveContentContext } from "../../guard";
export const dynamic = "force-dynamic";
export default async function ContentFolderPage({ params }) {
    const { id } = await params;
    let ctx;
    try {
        ctx = await resolveContentContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view this folder." })] }));
    }
    const folder = await getFolder(id, ctx.tenantId);
    if (!folder)
        notFound();
    const [items, childFolders, tags] = await Promise.all([
        listContentItems(ctx.tenantId, { folderId: id }),
        listFolders(ctx.tenantId),
        listTags(ctx.tenantId),
    ]);
    const children = childFolders.filter((f) => f.parent_id === folder.id);
    const visibleItems = ctx.session.role === "student" || ctx.session.role === "family"
        ? items.filter((i) => i.visibility === "public" || i.visibility === "tenant")
        : items;
    await logAudit("content.folder.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        folderId: id,
        count: visibleItems.length,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "space-y-1", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: [_jsx(Link, { href: "/content", className: "text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "Content Library" }), " ", "/"] }), _jsxs("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)] flex items-center gap-2", children: [folder.color ? (_jsx("span", { "aria-hidden": true, className: "inline-block h-3 w-3 rounded-full", style: { background: folder.color } })) : null, folder.name] }), folder.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: folder.description })) : null] }), children.length > 0 ? (_jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Subfolders" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: children.map((f) => (_jsxs(Link, { href: `/content/folder/${f.id}`, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3 hover:bg-white/5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [f.color ? (_jsx("span", { "aria-hidden": true, className: "inline-block h-2.5 w-2.5 rounded-full", style: { background: f.color } })) : null, _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: f.name })] }), f.description ? (_jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)] line-clamp-2", children: f.description })) : null] }, f.id))) })] })) : null, _jsxs("section", { className: "space-y-2", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Items" }), _jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: [visibleItems.length, " total"] })] }), _jsx(ContentList, { items: visibleItems })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Tags" }), _jsx(TagList, { tags: tags })] })] }));
}
