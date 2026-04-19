import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession, type Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type ContentApiContext = {
  session: Session;
  tenantId: string;
  canRead: boolean;
  canWrite: boolean;
};

export type ResolveOptions = {
  requireWrite?: boolean;
};

/**
 * Resolves the current caller's content context for any `/api/content/*`
 * endpoint. Enforces resolveContext → requireRole → requirePermission →
 * assertTenantAccess in that order, matching other ZiroWork APIs.
 */
export async function resolveContentApiContext(
  req: NextRequest,
  options?: ResolveOptions,
): Promise<ContentApiContext> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const scope = options?.requireWrite ? "content.write" : "content.read";
  await requirePermission(scope)();

  const url = new URL(req.url);
  const headerTenant = req.headers.get("x-tenant-id")?.trim() || null;
  const queryTenant = url.searchParams.get("tenantId")?.trim() || null;
  const tenantId =
    headerTenant || queryTenant || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  const permissions = getPermissionsForRole(session.role);

  return {
    session,
    tenantId,
    canRead: permissions.includes("content.read"),
    canWrite: permissions.includes("content.write"),
  };
}

export function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = "UNAUTHENTICATED"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function toAuthErrorResponse(err: unknown): NextResponse | null {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "UNAUTHENTICATED") return unauthorized(message);
  if (
    message === "FORBIDDEN" ||
    message === "INSUFFICIENT_PERMISSIONS" ||
    message === "TENANT_FORBIDDEN" ||
    message.startsWith("ROLE_")
  ) {
    return forbidden(message);
  }
  return null;
}
