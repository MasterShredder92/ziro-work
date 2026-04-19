import { NextRequest } from "next/server";
import { readJson, ok, created, badRequest } from "@/lib/http";
import { createRole, listRolesWithSummary } from "@/lib/admin/roles";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../_context";
import { handleError } from "../_handle";
import type { RoleInput } from "@/lib/admin/adminTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "director");
    requirePermission(session, "admin.roles.read");
    const data = await listRolesWithSummary(tenantId);
    return ok({ data });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.roles.write");
    const body = (await readJson<RoleInput>(req)) ?? ({} as RoleInput);
    if (!body.key && !body.name) {
      return badRequest("key or name required");
    }
    const role = await createRole(tenantId, body);
    return created({ data: role });
  } catch (err) {
    return handleError(err);
  }
}
