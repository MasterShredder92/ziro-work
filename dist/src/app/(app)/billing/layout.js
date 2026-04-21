import { jsx as _jsx } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { BILLING_NAV } from "./components/BillingSidebar";
import { BillingShell } from "./components/BillingShell";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingLayout({ children, }) {
    const session = await resolveSession();
    if (session.role !== "admin" && session.role !== "director") {
        redirect("/dashboard");
    }
    const permissions = getPermissionsForRole(session.role);
    const allowedNavIds = BILLING_NAV.filter((item) => !item.scope || permissions.includes(item.scope)).map((item) => item.id);
    return (_jsx(BillingShell, { tenantName: session.tenantId, allowedNavIds: allowedNavIds, children: children }));
}
