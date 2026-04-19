import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type SchedulingContext = {
  session: Session;
  tenantId: string;
};

export async function resolveSchedulingContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<SchedulingContext> {
  const session = await requireRole("director")();

  const scope = options?.requireWrite ? "scheduling.write" : "scheduling.read";
  await requirePermission(scope)();

  const tenantId =
    options?.tenantId?.trim() ||
    session.tenantId ||
    DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  return { session, tenantId };
}
