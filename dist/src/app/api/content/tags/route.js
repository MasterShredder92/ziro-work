import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createTag, listTags } from "@/lib/content";
import { resolveContentApiContext, toAuthErrorResponse, } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const ctx = await resolveContentApiContext(req);
        const tags = await listTags(ctx.tenantId);
        await logAudit("content.api.tags.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            count: tags.length,
        });
        return ok({ data: tags });
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
        if (!body || typeof body.label !== "string" || !body.label.trim()) {
            return badRequest("label required");
        }
        const tag = await createTag(ctx.tenantId, {
            label: body.label,
            slug: (_a = body.slug) !== null && _a !== void 0 ? _a : undefined,
            color: (_b = body.color) !== null && _b !== void 0 ? _b : null,
        });
        await logAudit("content.api.tags.create", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            tagId: tag.id,
            label: tag.label,
        });
        return created({ data: tag });
    }
    catch (err) {
        return (_c = toAuthErrorResponse(err)) !== null && _c !== void 0 ? _c : serverError(err);
    }
}
