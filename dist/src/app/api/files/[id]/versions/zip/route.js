import { badRequest, serverError } from "@/lib/http";
import { buildAllVersionsZip } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a, _b;
    try {
        const { id } = await params;
        if (!id)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req);
        const bytes = await buildAllVersionsZip(id, tenantId, ctx);
        const name = ((_a = req.headers.get("x-download-name")) === null || _a === void 0 ? void 0 : _a.replace(/[^\w.\-]+/g, "_")) ||
            `file-${id}-versions.zip`;
        return new Response(Buffer.from(bytes), {
            headers: {
                "content-type": "application/zip",
                "content-disposition": `attachment; filename="${name}"`,
            },
        });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}
