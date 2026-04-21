import { readJson, ok, noContent, badRequest } from "@/lib/http";
import { applyPermissionAssignment, revokePermissionAssignment, } from "@/lib/admin/roles";
import { resolveContext, requirePermission, requireRole, } from "../../_context";
import { handleError } from "../../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PATCH(req, ctx) {
    var _a;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.permissions.write");
        const { id } = await ctx.params;
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : null;
        if (!body)
            return badRequest("body required");
        const row = await applyPermissionAssignment(tenantId, Object.assign(Object.assign({}, body), { id }));
        return ok({ data: row });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function DELETE(req, ctx) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.permissions.write");
        const { id } = await ctx.params;
        await revokePermissionAssignment(tenantId, id);
        return noContent();
    }
    catch (err) {
        return handleError(err);
    }
}
