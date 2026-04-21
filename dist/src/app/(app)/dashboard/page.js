import { jsx as _jsx } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { isTenantOnboarded } from "@/lib/onboarding/gate";
const DashboardClient = dynamic(() => import("./_client").then((m) => m.DashboardClient), {
    loading: () => _jsx(PageShell, {}),
});
export default async function DashboardPage() {
    var _a;
    const session = await getSession().catch(() => null);
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const onboarded = await isTenantOnboarded(tenantId);
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!isDevelopment && !onboarded) {
        redirect("/onboarding");
    }
    return _jsx(DashboardClient, {});
}
