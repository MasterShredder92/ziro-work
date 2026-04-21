import "server-only";
import { NextResponse } from "next/server";
import { AdminApiError, resolveContext, requirePermission, requireRole, } from "@/app/api/admin/_context";
import { assertTenantAccess } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
/** Super-scope for tenant admin-only branding mutations (TASK 5 & 10). */
export const BRANDING_ADMIN_SCOPE = "admin.*";
/**
 * Read-only: directors (admin.branding.read) and tenant admins (admin.*).
 * Use for GET /api/branding/profile only.
 */
export async function resolveBrandingProfileReadContext(req) {
    const ctx = await resolveContext(req);
    await assertTenantAccess(ctx.tenantId);
    requirePermission(ctx.session, "admin.branding.read");
    return ctx;
}
/**
 * Full branding admin: role `admin` + permission `admin.*`.
 * All branding mutations and non-profile reads (theme, domain, email, layout).
 */
export async function resolveBrandingAdminOperatorContext(req) {
    const ctx = await resolveContext(req);
    await assertTenantAccess(ctx.tenantId);
    requireRole(ctx.session, "admin");
    requirePermission(ctx.session, BRANDING_ADMIN_SCOPE);
    return ctx;
}
export function brandingCanWrite(session) {
    return hasPermission(session.role, BRANDING_ADMIN_SCOPE);
}
/** Admin + `admin.*` — theme, domain, email identity, layout (read & write). */
export async function brandingReadContext(req) {
    return resolveBrandingAdminOperatorContext(req);
}
/** Same gate as reads — mutations require `admin.*` (Task 5). */
export async function brandingWriteContext(req) {
    return resolveBrandingAdminOperatorContext(req);
}
export function jsonAdminError(err) {
    if (err instanceof AdminApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return null;
}
