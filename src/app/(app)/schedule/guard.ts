import "server-only";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type ScheduleContext = {
  session: Session;
  tenantId: string;
  canWrite: boolean;
};

export async function resolveScheduleContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<ScheduleContext> {
  const scope = options?.requireWrite ? "schedule.write" : "schedule.read";
  const session = await requirePermission(scope)();

  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  const canWrite = ["admin", "director", "teacher"].includes(session.role);

  return { session, tenantId, canWrite };
}
