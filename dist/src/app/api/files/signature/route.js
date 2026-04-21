import { badRequest, created, readJson, serverError } from "@/lib/http";
import { createSignatureRequest } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireSign: true,
        });
        const body = await readJson(req);
        if (!body ||
            typeof body.fileId !== "string" ||
            typeof body.title !== "string") {
            return badRequest("fileId and title required");
        }
        if (!Array.isArray(body.signers) || body.signers.length === 0) {
            return badRequest("at least one signer required");
        }
        const request = await createSignatureRequest(tenantId, body, ctx);
        return created({ data: request });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
