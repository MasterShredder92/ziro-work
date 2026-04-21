import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getContentCollectionSurface } from "@/lib/content";
import { CollectionDetail } from "../../components";
import { resolveContentContext } from "../../guard";
export const dynamic = "force-dynamic";
export default async function ContentCollectionPage({ params }) {
    const { id } = await params;
    let ctx;
    try {
        ctx = await resolveContentContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view this collection." })] }));
    }
    const surface = await getContentCollectionSurface(id, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("content.collection.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        collectionId: id,
        itemCount: surface.items.length,
        source: "page",
    });
    return _jsx(CollectionDetail, { surface: surface });
}
