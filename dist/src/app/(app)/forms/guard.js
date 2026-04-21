import "server-only";
import { assertTenantAccess, requirePermission, requireRole, } from "@/lib/auth/guards";
import { roleAtLeast } from "@/lib/auth/roles";
export async function resolveFormsContext() {
    let session;
    try {
        session = await requireRole("director")();
    }
    catch (_a) {
        session = await requireRole("admin")();
    }
    if (!roleAtLeast(session.role, "director")) {
        throw new Error("FORBIDDEN");
    }
    await requirePermission("forms.read")();
    await assertTenantAccess(session.tenantId);
    return { session, tenantId: session.tenantId };
}
export async function assertFormsWrite() {
    const ctx = await resolveFormsContext();
    await requirePermission("forms.write")();
    return ctx;
}
