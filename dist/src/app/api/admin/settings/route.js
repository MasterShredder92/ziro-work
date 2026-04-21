import { readJson, ok } from "@/lib/http";
import { readSettings, writeSettings } from "@/lib/admin/settings";
import { resolveContext, requirePermission, requireRole, } from "../_context";
import { handleError } from "../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        requirePermission(session, "admin.settings.read");
        const data = await readSettings(tenantId);
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
        requireRole(session, "director");
        // directors can read and write their own studio settings
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const data = await writeSettings(tenantId, body);
        return ok({ data });
    }
    catch (err) {
        return handleError(err);
    }
}
