import { badRequest, noContent, ok, serverError, } from "@/lib/http";
import { deleteStoredFileVersion, restoreFileToVersion, signedUrlForFileVersion, } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params, }) {
    var _a, _b;
    try {
        const { id: fileId, versionId } = await params;
        if (!fileId || !versionId)
            return badRequest("ids required");
        const { tenantId, ctx } = await resolveFilesApiContext(req);
        const url = new URL(req.url);
        if (url.searchParams.get("signedUrl") === "true") {
            const ttl = Number((_a = url.searchParams.get("ttl")) !== null && _a !== void 0 ? _a : "3600");
            const signed = await signedUrlForFileVersion(fileId, versionId, tenantId, ctx, {
                ttlSeconds: Number.isFinite(ttl) ? ttl : 3600,
                download: url.searchParams.get("download") === "true",
            });
            return ok({ data: { signedUrl: signed } });
        }
        return badRequest("signedUrl=true required");
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
export async function POST(req, { params, }) {
    var _a;
    try {
        const { id: fileId, versionId } = await params;
        if (!fileId || !versionId)
            return badRequest("ids required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const file = await restoreFileToVersion(fileId, versionId, tenantId, ctx);
        return ok({ data: file });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function DELETE(req, { params, }) {
    var _a;
    try {
        const { id: fileId, versionId } = await params;
        if (!fileId || !versionId)
            return badRequest("ids required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        await deleteStoredFileVersion(fileId, versionId, tenantId, ctx);
        return noContent();
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
