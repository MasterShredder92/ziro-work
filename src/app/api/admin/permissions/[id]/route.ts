import { NextRequest } from "next/server";
import { readJson, ok, noContent, badRequest } from "@/lib/http";
import {
  applyPermissionAssignment,
  revokePermissionAssignment,
} from "@/lib/admin/roles";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../../_context";
import { handleError } from "../../_handle";
import type { PermissionAssignmentInput } from "@/lib/admin/adminTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.permissions.write");
    const { id } = await ctx.params;
    const body = (await readJson<PermissionAssignmentInput>(req)) ?? null;
    if (!body) return badRequest("body required");
    const row = await applyPermissionAssignment(tenantId, { ...body, id });
    return ok({ data: row });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.permissions.write");
    const { id } = await ctx.params;
    await revokePermissionAssignment(tenantId, id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
