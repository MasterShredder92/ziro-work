import { sendTestEmailIdentity } from "@/lib/branding";
import { readJson, ok } from "@/lib/http";
import { handleError } from "@/app/api/admin/_handle";
import { AdminApiError } from "@/app/api/admin/_context";
import { brandingWriteContext } from "../../_auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b, _c, _d;
    try {
        const { tenantId } = await brandingWriteContext(req);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const id = ((_b = body.id) === null || _b === void 0 ? void 0 : _b.trim()) || ((_c = body.identityId) === null || _c === void 0 ? void 0 : _c.trim());
        if (!id || !((_d = body.to) === null || _d === void 0 ? void 0 : _d.trim())) {
            throw new AdminApiError("INVALID_BODY", 400);
        }
        const result = await sendTestEmailIdentity(tenantId, id, body.to.trim());
        return ok({ data: result });
    }
    catch (err) {
        return handleError(err);
    }
}
