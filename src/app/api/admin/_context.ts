import "server-only";
import type { NextRequest } from "next/server";
import { getSession, type Session } from "@/lib/auth/session";
import { roleAtLeast, type Role } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";
import { resolveTenantIdFromRequest } from "@/lib/http";

export type AdminApiContext = {
  session: Session;
  tenantId: string;
};

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function resolveContext(req: NextRequest): Promise<AdminApiContext> {
  const session = await getSession();
  if (!session) throw new AdminApiError("UNAUTHENTICATED", 401);
  const tenantId = await resolveTenantIdFromRequest(req);
  if (!tenantId) throw new AdminApiError("TENANT_REQUIRED", 400);

  const baseRole = session.baseRole ?? session.role;
  if (baseRole !== "admin" && session.tenantId !== tenantId) {
    throw new AdminApiError("FORBIDDEN", 403);
  }
  return { session, tenantId };
}

export function requireRole(session: Session, required: Role): void {
  if (!roleAtLeast(session.role, required)) {
    throw new AdminApiError("FORBIDDEN", 403);
  }
}

export function requirePermission(
  session: Session,
  permission: string,
): void {
  if (!hasPermission(session.role, permission)) {
    throw new AdminApiError("FORBIDDEN", 403);
  }
}
