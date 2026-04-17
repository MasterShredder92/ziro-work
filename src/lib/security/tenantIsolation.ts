import "server-only";
import type { Session } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/AppError";

/**
 * Thin helpers on top of `@/lib/auth/guards` that throw the new AppError
 * shape (FORBIDDEN with explanatory details) instead of bare Error.
 *
 * Existing `assertTenantAccess` / `assertTenantMatch` are kept as-is for
 * backwards compatibility; new call sites should prefer these.
 */

export interface TenantContext {
  session: Session;
  tenantId: string;
}

export function assertTenantScoped(
  session: Session | null,
  resourceTenantId: string | null | undefined,
): TenantContext {
  if (!session) throw AppError.unauthenticated();
  const expected = (resourceTenantId ?? "").trim();
  if (!expected) throw AppError.forbidden("Resource has no tenant context");
  const base = session.baseRole ?? session.role;
  if (base !== "admin" && session.tenantId !== expected) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Cross-tenant access blocked",
      details: { sessionTenantId: session.tenantId, resourceTenantId: expected },
    });
  }
  return { session, tenantId: expected };
}

export function filterByTenant<T extends { tenant_id?: string | null; tenantId?: string | null }>(
  rows: T[],
  session: Session,
): T[] {
  const base = session.baseRole ?? session.role;
  if (base === "admin") return rows;
  return rows.filter((r) => {
    const rowTenant = (r.tenant_id ?? r.tenantId ?? "") as string;
    return rowTenant === session.tenantId;
  });
}
