import { readJson, ok, noContent, notFound } from "@/lib/http";
import { deleteRole, listRolesWithSummary, updateRole, } from "@/lib/admin/roles";
import { resolveContext, requirePermission, requireRole, } from "../../_context";
import { handleError } from "../../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        requirePermission(session, "admin.roles.read");
        const { id } = await ctx.params;
        const summaries = await listRolesWithSummary(tenantId);
        const found = summaries.find((r) => r.role.id === id);
        if (!found)
            return notFound("role.not_found");
        return ok({ data: found });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function PATCH(req, ctx) {
    var _a;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.roles.write");
        const { id } = await ctx.params;
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const updated = await updateRole(tenantId, id, body);
        return ok({ data: updated });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function DELETE(req, ctx) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.roles.write");
        const { id } = await ctx.params;
        await deleteRole(tenantId, id);
        return noContent();
    }
    catch (err) {
        return handleError(err);
    }
}
