var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { createFile, getFilesDashboard } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "./_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const { tenantId } = await resolveFilesApiContext(req);
        const data = await getFilesDashboard(tenantId);
        return ok({ data });
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
        const { upload } = body, input = __rest(body, ["upload"]);
        const file = await createFile({ tenantId, input, upload, context: ctx });
        return created({ data: file });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
