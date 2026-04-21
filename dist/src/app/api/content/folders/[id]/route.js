import { badRequest, noContent, notFound, ok, readJson, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { deleteFolder, getFolder, updateFolder, } from "@/lib/content";
import { resolveContentApiContext, toAuthErrorResponse, } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req);
        const folder = await getFolder(id, ctx.tenantId);
        if (!folder)
            return notFound("folder not found");
        return ok({ data: folder });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function PATCH(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        if (!body)
            return badRequest("request body required");
        const folder = await updateFolder(id, ctx.tenantId, body);
        await logAudit("content.api.folders.update", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            folderId: id,
        });
        return ok({ data: folder });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "NOT_FOUND")
            return notFound("folder not found");
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function DELETE(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        await deleteFolder(id, ctx.tenantId);
        await logAudit("content.api.folders.delete", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            folderId: id,
        });
        return noContent();
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
