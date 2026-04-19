import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AdminApiError,
  resolveContext,
  requirePermission,
  requireRole,
} from "@/app/api/admin/_context";
import { assertTenantAccess } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import type { AdminApiContext } from "@/app/api/admin/_context";

/** Super-scope for tenant admin-only branding mutations (TASK 5 & 10). */
export const BRANDING_ADMIN_SCOPE = "admin.*";

/**
 * Read-only: directors (admin.branding.read) and tenant admins (admin.*).
 * Use for GET /api/branding/profile only.
 */
export async function resolveBrandingProfileReadContext(
  req: NextRequest,
): Promise<AdminApiContext> {
  const ctx = await resolveContext(req);
  await assertTenantAccess(ctx.tenantId);
  requirePermission(ctx.session, "admin.branding.read");
  return ctx;
}

/**
 * Full branding admin: role `admin` + permission `admin.*`.
 * All branding mutations and non-profile reads (theme, domain, email, layout).
 */
export async function resolveBrandingAdminOperatorContext(
  req: NextRequest,
): Promise<AdminApiContext> {
  const ctx = await resolveContext(req);
  await assertTenantAccess(ctx.tenantId);
  requireRole(ctx.session, "admin");
  requirePermission(ctx.session, BRANDING_ADMIN_SCOPE);
  return ctx;
}

export function brandingCanWrite(session: AdminApiContext["session"]): boolean {
  return hasPermission(session.role, BRANDING_ADMIN_SCOPE);
}

/** Admin + `admin.*` — theme, domain, email identity, layout (read & write). */
export async function brandingReadContext(
  req: NextRequest,
): Promise<AdminApiContext> {
  return resolveBrandingAdminOperatorContext(req);
}

/** Same gate as reads — mutations require `admin.*` (Task 5). */
export async function brandingWriteContext(
  req: NextRequest,
): Promise<AdminApiContext> {
  return resolveBrandingAdminOperatorContext(req);
}

export function jsonAdminError(err: unknown): NextResponse | null {
  if (err instanceof AdminApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
