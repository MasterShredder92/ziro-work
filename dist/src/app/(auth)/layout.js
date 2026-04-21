import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { getBrandingRuntime } from "@/lib/branding";
import { BrandingStyleTag } from "@/app/(app)/admin/branding/components/BrandingStyleTag";
import { SystemProviders } from "@/components/system/SystemProviders";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export default async function AuthLayout({ children }) {
    var _a;
    const h = await headers();
    const tenantId = ((_a = h.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const runtime = await getBrandingRuntime(tenantId).catch(() => null);
    return (_jsxs(SystemProviders, { defaultTenantId: DEFAULT_TENANT_ID, children: [runtime ? _jsx(BrandingStyleTag, { runtime: runtime }) : null, children] }));
}
