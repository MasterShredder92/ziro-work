import { badRequest, created, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { uploadAsset } from "@/lib/content";
import { fireContentTrigger } from "@/lib/content/triggers";
import { resolveContentApiContext, toAuthErrorResponse, } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b, _c;
    try {
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        if (!body ||
            typeof body.name !== "string" ||
            !body.name.trim() ||
            typeof body.url !== "string" ||
            !body.url.trim()) {
            return badRequest("name and url required");
        }
        const asset = await uploadAsset(ctx.tenantId, Object.assign(Object.assign({}, body), { name: body.name, url: body.url, created_by: (_a = body.created_by) !== null && _a !== void 0 ? _a : ctx.session.userId }));
        await fireContentTrigger("content.asset.uploaded", {
            tenantId: ctx.tenantId,
            itemId: (_b = asset.item_id) !== null && _b !== void 0 ? _b : undefined,
            profileId: ctx.session.userId,
            data: {
                assetId: asset.id,
                kind: asset.kind,
                name: asset.name,
                mimeType: asset.mime_type,
                sizeBytes: asset.size_bytes,
            },
        }).catch(() => null);
        await logAudit("content.api.upload", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            assetId: asset.id,
            kind: asset.kind,
        });
        return created({ data: asset });
    }
    catch (err) {
        return (_c = toAuthErrorResponse(err)) !== null && _c !== void 0 ? _c : serverError(err);
    }
}
