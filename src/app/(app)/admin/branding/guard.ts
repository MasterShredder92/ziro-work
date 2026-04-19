import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { ADMIN_STAR_SCOPE, hasPermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type BrandingContext = {
  session: Session;
  tenantId: string;
  canWrite: boolean;
};

/**
 * Branding dashboard (read-only for directors): `admin.branding.read`.
 * Teachers, families, students have no branding permissions.
 */
export async function resolveBrandingDashboardContext(options?: {
  tenantId?: string | null;
}): Promise<BrandingContext> {
  const session = await requirePermission("admin.branding.read")();
  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  return {
    session,
    tenantId,
    canWrite: hasPermission(session.role, ADMIN_STAR_SCOPE),
  };
}

/**
 * Theme, domain, email, layout, preview surfaces — tenant `admin` + `admin.*` only.
 */
export async function resolveBrandingAdminSurfaceContext(options?: {
  tenantId?: string | null;
}): Promise<BrandingContext> {
  const session = await requireRole("admin")();
  await requirePermission(ADMIN_STAR_SCOPE)();
  const tenantId =
    options?.tenantId?.trim() || session.tenantId || DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  return {
    session,
    tenantId,
    canWrite: true,
  };
}

/** @deprecated Use resolveBrandingDashboardContext or resolveBrandingAdminSurfaceContext */
export async function resolveBrandingContext(options?: {
  tenantId?: string | null;
  requireWrite?: boolean;
}): Promise<BrandingContext> {
  if (options?.requireWrite) {
    return resolveBrandingAdminSurfaceContext(options);
  }
  return resolveBrandingDashboardContext(options);
}
