import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { createFolder } from "@/lib/files/service";
import { listFolders } from "@/lib/files/queries";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const { tenantId } = await resolveFilesApiContext(req);
        const url = new URL(req.url);
        const parentId = url.searchParams.get("parentId");
        const folders = await listFolders(tenantId, parentId === null
            ? undefined
            : parentId === "root"
                ? null
                : parentId);
        return ok({ data: folders });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function POST(req) {
    var _a;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const body = await readJson(req);
        if (!body || typeof body.name !== "string" || !body.name.trim()) {
            return badRequest("name required");
        }
        const folder = await createFolder(tenantId, body, ctx);
        return created({ data: folder });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
