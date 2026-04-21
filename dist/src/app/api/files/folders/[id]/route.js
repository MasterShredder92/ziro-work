import { badRequest, noContent, ok, readJson, serverError, } from "@/lib/http";
import { deleteFolderById, getFolderSurface, updateFolder, } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req);
        const surface = await getFolderSurface(id, tenantId, ctx);
        return ok({ data: surface });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
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
        const folder = await updateFolder(id, tenantId, body, ctx);
        return ok({ data: folder });
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
        await deleteFolderById(id, tenantId, ctx);
        return noContent();
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
