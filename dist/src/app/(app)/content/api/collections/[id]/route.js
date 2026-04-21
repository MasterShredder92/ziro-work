import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { addItemToCollection, getContentCollectionSurface, removeItemFromCollection, } from "@/lib/content";
import { resolveContentContext } from "../../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        let ctx;
        try {
            ctx = await resolveContentContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const surface = await getContentCollectionSurface(id, ctx.tenantId);
        if (!surface) {
            return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        }
        const filtered = ctx.session.role === "student" || ctx.session.role === "family"
            ? Object.assign(Object.assign({}, surface), { items: surface.items.filter((i) => i.visibility === "public" || i.visibility === "tenant") }) : surface;
        await logAudit("content.collection.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            collectionId: id,
            itemCount: filtered.items.length,
            source: "api",
        });
        return ok({ data: filtered });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req, { params }) {
    var _a, _b;
    try {
        const { id } = await params;
        let ctx;
        try {
            ctx = await resolveContentContext({ requireWrite: true });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const body = (await req.json().catch(() => ({})));
        const itemId = (_a = body.itemId) === null || _a === void 0 ? void 0 : _a.trim();
        const action = (_b = body.action) !== null && _b !== void 0 ? _b : "add";
        if (!itemId) {
            return NextResponse.json({ error: "itemId is required" }, { status: 400 });
        }
        const result = action === "remove"
            ? await removeItemFromCollection(itemId, id, ctx.tenantId)
            : await addItemToCollection(itemId, id, ctx.tenantId);
        await logAudit(`content.collection.${action}`, {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            collectionId: id,
            itemId,
            source: "api",
        });
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}
