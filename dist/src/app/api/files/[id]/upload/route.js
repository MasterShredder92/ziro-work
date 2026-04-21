import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { uploadNewVersion } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const body = await readJson(req);
        if (!body ||
            typeof body.fileName !== "string" ||
            typeof body.base64 !== "string") {
            return badRequest("fileName and base64 required");
        }
        const file = await uploadNewVersion(id, tenantId, body, ctx);
        return ok({ data: file });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
