import { badRequest, ok, serverError } from "@/lib/http";
import { listVersions } from "@/lib/files/queries";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId } = await resolveFilesApiContext(req);
        const versions = await listVersions(id, tenantId);
        return ok({ data: versions });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
