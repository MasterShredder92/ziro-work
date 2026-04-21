import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createContentItem, listContentItems, } from "@/lib/content";
import { fireContentItemEvent, } from "@/lib/content/triggers";
import { resolveContentApiContext, toAuthErrorResponse, } from "./_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const ctx = await resolveContentApiContext(req);
        const url = new URL(req.url);
        const folderId = url.searchParams.get("folderId");
        const tagId = url.searchParams.get("tagId");
        const kind = url.searchParams.get("kind");
        const contentType = url.searchParams.get("contentType");
        const visibility = url.searchParams.get("visibility");
        const search = url.searchParams.get("search");
        const includeArchived = url.searchParams.get("includeArchived") === "true";
        const publishedOnly = url.searchParams.get("publishedOnly") === "true";
        const items = await listContentItems(ctx.tenantId, {
            folderId: folderId === "root" ? null : folderId !== null && folderId !== void 0 ? folderId : undefined,
            tagId: tagId !== null && tagId !== void 0 ? tagId : undefined,
            kind: kind !== null && kind !== void 0 ? kind : undefined,
            contentType: contentType !== null && contentType !== void 0 ? contentType : undefined,
            visibility: visibility !== null && visibility !== void 0 ? visibility : undefined,
            search: search !== null && search !== void 0 ? search : undefined,
            includeArchived,
            publishedOnly,
        });
        const visible = ctx.session.role === "student" || ctx.session.role === "family"
            ? items.filter((i) => i.visibility === "public" || i.visibility === "tenant")
            : items;
        await logAudit("content.api.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            total: visible.length,
        });
        return ok({ data: visible });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c;
    try {
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        if (!body || typeof body.title !== "string" || !body.title.trim()) {
            return badRequest("title required");
        }
        const item = await createContentItem(Object.assign(Object.assign({}, body), { tenant_id: ctx.tenantId, title: body.title, created_by: (_a = body.created_by) !== null && _a !== void 0 ? _a : ctx.session.userId, updated_by: (_b = body.updated_by) !== null && _b !== void 0 ? _b : ctx.session.userId }));
        await fireContentItemEvent("content.created", item).catch(() => null);
        if (item.is_published) {
            await fireContentItemEvent("content.published", item).catch(() => null);
        }
        await logAudit("content.api.create", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: item.id,
            title: item.title,
        });
        return created({ data: item });
    }
    catch (err) {
        return (_c = toAuthErrorResponse(err)) !== null && _c !== void 0 ? _c : serverError(err);
    }
}
