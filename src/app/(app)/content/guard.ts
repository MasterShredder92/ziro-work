import "server-only";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type ContentContext = {
  session: Session;
  tenantId: string;
  canRead: boolean;
  canWrite: boolean;
};

/**
 * Content library is available to any role that has content.read. Write
 * operations are limited to teacher/director/admin via content.write.
 * Students and families get read-only access filtered by visibility in the UI.
 */
export async function resolveContentContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<ContentContext> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const permissions = getPermissionsForRole(session.role);
  const requiredScope = options?.requireWrite ? "content.write" : "content.read";

  if (!permissions.includes(requiredScope)) {
    throw new Error("FORBIDDEN");
  }

  await requirePermission(requiredScope)();

  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  return {
    session,
    tenantId,
    canRead: permissions.includes("content.read"),
    canWrite: permissions.includes("content.write"),
  };
}
