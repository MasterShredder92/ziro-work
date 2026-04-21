import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { regenerateShareLinkToken } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b;
    try {
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireShare: true,
        });
        const body = await readJson(req);
        const linkId = (_a = body === null || body === void 0 ? void 0 : body.linkId) === null || _a === void 0 ? void 0 : _a.trim();
        if (!linkId)
            return badRequest("linkId required");
        const link = await regenerateShareLinkToken(linkId, tenantId, ctx);
        return ok({ data: link });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
