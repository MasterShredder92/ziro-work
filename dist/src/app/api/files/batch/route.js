import { badRequest, noContent, readJson, serverError } from "@/lib/http";
import { bulkDeleteFiles, bulkMoveFiles } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const body = await readJson(req);
        if (!(body === null || body === void 0 ? void 0 : body.action) || !Array.isArray(body.fileIds) || body.fileIds.length === 0) {
            return badRequest("action and fileIds required");
        }
        if (body.action === "delete") {
            await bulkDeleteFiles(body.fileIds, tenantId, ctx);
            return noContent();
        }
        if (body.action === "move") {
            await bulkMoveFiles(body.fileIds, (_a = body.folderId) !== null && _a !== void 0 ? _a : null, tenantId, ctx);
            return noContent();
        }
        return badRequest("unknown action");
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
