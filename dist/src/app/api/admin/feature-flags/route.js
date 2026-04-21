import { readJson, ok, badRequest } from "@/lib/http";
import { listFlags, setFlag } from "@/lib/admin/features";
import { resolveContext, requirePermission, requireRole, } from "../_context";
import { handleError } from "../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        requirePermission(session, "admin.feature_flags.read");
        const data = await listFlags(tenantId);
        return ok({ data });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function PATCH(req) {
    var _a;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.feature_flags.write");
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : null;
        if (!body || !body.key)
            return badRequest("key required");
        const row = await setFlag(tenantId, body);
        return ok({ data: row });
    }
    catch (err) {
        return handleError(err);
    }
}
