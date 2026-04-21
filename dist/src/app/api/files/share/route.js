import { badRequest, created, noContent, ok, readJson, serverError, } from "@/lib/http";
import { createShareLink, patchShareLink, revokeShareLinkById, } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireShare: true,
        });
        const raw = await readJson(req);
        if (!raw)
            return badRequest("body required");
        const input = raw && typeof raw === "object" && "input" in raw
            ? raw.input
            : raw;
        if (!input || (!input.fileId && !input.folderId)) {
            return badRequest("fileId or folderId required");
        }
        const link = await createShareLink(tenantId, input, ctx);
        return created({ data: link });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function DELETE(req) {
    var _a, _b;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireShare: true,
        });
        const url = new URL(req.url);
        const id = (_a = url.searchParams.get("id")) === null || _a === void 0 ? void 0 : _a.trim();
        if (!id)
            return badRequest("id required");
        await revokeShareLinkById(id, tenantId, ctx);
        return noContent();
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
export async function PATCH(req) {
    var _a, _b;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireShare: true,
        });
        const body = await readJson(req);
        if (!(body === null || body === void 0 ? void 0 : body.id))
            return badRequest("id required");
        const meta = Object.assign({}, ((_a = body.metadata) !== null && _a !== void 0 ? _a : {}));
        if (body.linkDisabled !== undefined)
            meta.linkDisabled = body.linkDisabled;
        if (body.watermarkPreview !== undefined)
            meta.watermarkPreview = body.watermarkPreview;
        const link = await patchShareLink(body.id, tenantId, Object.assign({ metadata: meta }, (body.allowDownload !== undefined
            ? { allowDownload: body.allowDownload }
            : {})), ctx);
        return ok({ data: link });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
