import "server-only";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type AssessmentsContext = {
  session: Session;
  tenantId: string;
  canWrite: boolean;
  canRun: boolean;
  canGrade: boolean;
};

/**
 * Assessments are available to any role that has assessments.read. Write
 * and grading are limited to teacher/director/admin via assessments.write.
 * Students and families can still access runner pages because they have
 * assessments.read + assessments.run in their permission set.
 */
export async function resolveAssessmentsContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
  requireRun?: boolean;
}): Promise<AssessmentsContext> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const permissions = getPermissionsForRole(session.role);
  const requiredScope = options?.requireWrite
    ? "assessments.write"
    : options?.requireRun
      ? "assessments.run"
      : "assessments.read";

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
    canWrite: permissions.includes("assessments.write"),
    canRun: permissions.includes("assessments.run"),
    canGrade: permissions.includes("assessments.write"),
  };
}
