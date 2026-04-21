import { readJson, ok, created, badRequest } from "@/lib/http";
import { createRole, listRolesWithSummary } from "@/lib/admin/roles";
import { resolveContext, requirePermission, requireRole, } from "../_context";
import { handleError } from "../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        requirePermission(session, "admin.roles.read");
        const data = await listRolesWithSummary(tenantId);
        return ok({ data });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function POST(req) {
    var _a;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.roles.write");
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        if (!body.key && !body.name) {
            return badRequest("key or name required");
        }
        const role = await createRole(tenantId, body);
        return created({ data: role });
    }
    catch (err) {
        return handleError(err);
    }
}
