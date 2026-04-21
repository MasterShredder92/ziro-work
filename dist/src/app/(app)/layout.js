var _a;
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { CleanLayout } from "@/components/layouts/CleanLayout";
import { SystemProviders } from "@/components/system/SystemProviders";
import { AgentOSRoot } from "@/components/agentOS";
import { getSession } from "@/lib/auth/session";
import { getBrandingRuntime } from "@/lib/branding";
import { ensureQueueHandlersRegistered } from "@/lib/queue/registerHandlers";
import { BrandingStyleTag } from "./admin/branding/components/BrandingStyleTag";
const DEFAULT_TENANT_ID = (_a = process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID) !== null && _a !== void 0 ? _a : "00000000-0000-0000-0000-000000000001";
export default async function AppLayout({ children }) {
    var _a, _b;
    ensureQueueHandlersRegistered();
    const session = await getSession().catch(() => null);
    const h = await headers();
    const headerTenant = (_a = h.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim();
    const tenantId = headerTenant && headerTenant.length > 0
        ? headerTenant
        : (_b = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _b !== void 0 ? _b : DEFAULT_TENANT_ID;
    const runtime = await getBrandingRuntime(tenantId).catch(() => null);
    return (_jsx(SystemProviders, { defaultTenantId: tenantId, children: _jsxs(AgentOSRoot, { children: [runtime ? _jsx(BrandingStyleTag, { runtime: runtime }) : null, _jsx(CleanLayout, { children: children })] }) }));
}
