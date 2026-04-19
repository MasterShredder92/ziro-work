import { NextRequest } from "next/server";
import { readJson, ok, created, badRequest } from "@/lib/http";
import {
  listAssignmentsForProfile,
  listAssignmentsForRole,
  applyPermissionAssignment,
} from "@/lib/admin/roles";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../_context";
import { handleError } from "../_handle";
import type { PermissionAssignmentInput } from "@/lib/admin/adminTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "director");
    requirePermission(session, "admin.permissions.read");
    const url = new URL(req.url);
    const profileId = url.searchParams.get("profileId");
    const roleId = url.searchParams.get("roleId");
    if (profileId) {
      return ok({
        data: await listAssignmentsForProfile(tenantId, profileId),
      });
    }
    if (roleId) {
      return ok({ data: await listAssignmentsForRole(tenantId, roleId) });
    }
    return badRequest("profileId or roleId required");
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.permissions.write");
    const body = (await readJson<PermissionAssignmentInput>(req)) ?? null;
    if (!body || !body.profile_id || !body.permission_key) {
      return badRequest("profile_id and permission_key required");
    }
    const row = await applyPermissionAssignment(tenantId, body);
    return created({ data: row });
  } catch (err) {
    return handleError(err);
  }
}
