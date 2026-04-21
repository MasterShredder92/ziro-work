import { badRequest, noContent, notFound, ok, readJson, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { deleteContentTag, getContentTag, upsertContentTag, } from "@data/contentTags";
import { resolveContentApiContext, toAuthErrorResponse, } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req);
        const tag = await getContentTag(id, ctx.tenantId);
        if (!tag)
            return notFound("tag not found");
        return ok({ data: tag });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function PATCH(req, { params }) {
    var _a, _b;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        if (!body)
            return badRequest("request body required");
        const existing = await getContentTag(id, ctx.tenantId);
        if (!existing)
            return notFound("tag not found");
        const tag = await upsertContentTag(ctx.tenantId, Object.assign(Object.assign(Object.assign({}, existing), body), { id, label: (_a = body.label) !== null && _a !== void 0 ? _a : existing.label }));
        await logAudit("content.api.tags.update", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            tagId: id,
        });
        return ok({ data: tag });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
export async function DELETE(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        await deleteContentTag(id, ctx.tenantId);
        await logAudit("content.api.tags.delete", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            tagId: id,
        });
        return noContent();
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
