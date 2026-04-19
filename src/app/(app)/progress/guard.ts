import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type ProgressContext = {
  session: Session;
  tenantId: string;
};

export async function resolveProgressContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<ProgressContext> {
  const session = await requireRole("teacher")();

  const scope = options?.requireWrite ? "progress.write" : "progress.read";
  await requirePermission(scope)();

  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  return { session, tenantId };
}
