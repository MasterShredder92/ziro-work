import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type AttendanceContext = {
  session: Session;
  tenantId: string;
};

export async function resolveAttendancePageContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<AttendanceContext> {
  const session = await requireRole("teacher")();

  const scope = options?.requireWrite ? "attendance.write" : "attendance.read";
  await requirePermission(scope)();

  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  return { session, tenantId };
}
