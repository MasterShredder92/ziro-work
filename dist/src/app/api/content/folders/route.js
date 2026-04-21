import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createFolder, listFolders } from "@/lib/content";
import { resolveContentApiContext, toAuthErrorResponse, } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const ctx = await resolveContentApiContext(req);
        const folders = await listFolders(ctx.tenantId);
        await logAudit("content.api.folders.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            count: folders.length,
        });
        return ok({ data: folders });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function POST(req) {
    var _a, _b;
    try {
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        if (!body || typeof body.name !== "string" || !body.name.trim()) {
            return badRequest("name required");
        }
        const folder = await createFolder(ctx.tenantId, Object.assign(Object.assign({}, body), { name: body.name, created_by: (_a = body.created_by) !== null && _a !== void 0 ? _a : ctx.session.userId }));
        await logAudit("content.api.folders.create", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            folderId: folder.id,
            name: folder.name,
        });
        return created({ data: folder });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
