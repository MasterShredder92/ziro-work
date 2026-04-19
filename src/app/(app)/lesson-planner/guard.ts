import "server-only";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type LessonPlannerContext = {
  session: Session;
  tenantId: string;
  canWrite: boolean;
};

/**
 * Lesson Planner is available to teacher, director, and admin roles.
 * Student and family roles have no access. Both read and write scopes are
 * granted to teacher/director/admin; the `canWrite` flag remains for future
 * UI gating.
 */
export async function resolveLessonPlannerContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<LessonPlannerContext> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const permissions = getPermissionsForRole(session.role);
  const scope = options?.requireWrite
    ? "lessonPlanner.write"
    : "lessonPlanner.read";
  if (!permissions.includes(scope)) {
    throw new Error("FORBIDDEN");
  }

  await requirePermission(scope)();

  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  return {
    session,
    tenantId,
    canWrite: permissions.includes("lessonPlanner.write"),
  };
}
