import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export async function resolveBrandingTenantId(searchParams) {
    const p = searchParams.tenantId;
    const fromParam = Array.isArray(p) ? p[0] : p;
    if (fromParam === null || fromParam === void 0 ? void 0 : fromParam.trim())
        return fromParam.trim();
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader === null || fromHeader === void 0 ? void 0 : fromHeader.trim())
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
