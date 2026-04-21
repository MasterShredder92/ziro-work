import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/** Resolve the tenant id for CRM pages, falling back to the demo tenant. */
export async function getCRMTenantId() {
    const session = await getSession();
    if (session === null || session === void 0 ? void 0 : session.tenantId)
        return session.tenantId;
    return DEFAULT_TENANT_ID;
}
