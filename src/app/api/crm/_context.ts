import { NextRequest, NextResponse } from "next/server";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { getSession, type Session } from "@/lib/auth/session";
import { roleAtLeast, type Role } from "@/lib/auth/roles";
import { resolveTenantIdFromRequest } from "@/lib/http";

export type CRMContext = {
  session: Session;
  tenantId: string;
};

/**
 * Combined guard for all /api/crm/* routes:
 *  - resolveContext (session + tenant)
 *  - requireRole (must be at least the provided role)
 *  - requirePermission (one of the given scopes)
 *  - assertTenantAccess (session.tenantId must match request tenant
 *    unless the caller is a platform admin)
 */
export async function resolveCRMContext(
  req: NextRequest,
  opts: {
    minRole?: Role;
    permissions: string[];
  },
): Promise<{ context: CRMContext } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }

  const minRole = opts.minRole ?? "teacher";
  if (!roleAtLeast(session.role, minRole)) {
    return {
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  const scopes = getPermissionsForRole(session.role);
  const hasScope = opts.permissions.some((p) => scopes.includes(p));
  if (!hasScope) {
    return {
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  const tenantId = await resolveTenantIdFromRequest(req);
  const base = session.baseRole ?? session.role;
  if (base !== "admin" && session.tenantId !== tenantId) {
    return {
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return { context: { session, tenantId } };
}
