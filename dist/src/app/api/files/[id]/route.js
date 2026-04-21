import { badRequest, noContent, ok, readJson, serverError, } from "@/lib/http";
import { createSignedFileUrl, deleteFileAndStorage, getFileSurface, updateFile, } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a, _b;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req);
        const surface = await getFileSurface(id, tenantId, ctx);
        const url = new URL(req.url);
        if (url.searchParams.get("signedUrl") === "true") {
            const ttl = Number((_a = url.searchParams.get("ttl")) !== null && _a !== void 0 ? _a : "3600");
            const signed = await createSignedFileUrl(id, tenantId, ctx, {
                ttlSeconds: Number.isFinite(ttl) ? ttl : 3600,
            });
            return ok({ data: { surface, signedUrl: signed } });
        }
        return ok({ data: surface });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
export async function PATCH(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const body = await readJson(req);
        if (!body)
            return badRequest("body required");
        const file = await updateFile(id, tenantId, body, ctx);
        return ok({ data: file });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function DELETE(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const url = new URL(req.url);
        const hard = url.searchParams.get("hard") === "true";
        if (hard) {
            await deleteFileAndStorage(id, tenantId, ctx);
        }
        else {
            await deleteFileAndStorage(id, tenantId, ctx);
        }
        return noContent();
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
