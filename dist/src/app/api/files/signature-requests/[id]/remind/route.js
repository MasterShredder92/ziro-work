import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { sendSignatureReminder } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req, { params }) {
    var _a;
    try {
        const { id: requestId } = await params;
        if (!requestId)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireSign: true,
        });
        const body = await readJson(req);
        if (!(body === null || body === void 0 ? void 0 : body.signerId))
            return badRequest("signerId required");
        const updated = await sendSignatureReminder(requestId, body.signerId, tenantId, ctx);
        return ok({ data: updated });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
