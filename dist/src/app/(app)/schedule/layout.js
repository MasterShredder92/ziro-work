import { jsx as _jsx } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { canForRole } from "@/lib/auth/permissions";
import { ScheduleShell } from "./components/ScheduleShell";
export const dynamic = "force-dynamic";
export default async function ScheduleLayout({ children, }) {
    var _a;
    const session = await getSession();
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const canWrite = !!session && canForRole(session.role, "schedule.write");
    const tenantLabel = tenantId === DEFAULT_TENANT_ID ? "Workspace" : tenantId;
    return (_jsx(ScheduleShell, { tenantLabel: tenantLabel, canWrite: canWrite, children: children }));
}
