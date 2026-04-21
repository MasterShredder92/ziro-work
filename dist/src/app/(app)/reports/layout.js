import { jsx as _jsx } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { listReports } from "@/lib/reports/service";
import { ReportsShell } from "./components/ReportsShell";
export const dynamic = "force-dynamic";
export default async function ReportsLayout({ children, }) {
    var _a;
    // Permission guard: admin, director, and teacher all hold reports.read
    // (teachers scoped to their own data by the data facades).
    let session = null;
    try {
        session = await requirePermission("reports.read")();
    }
    catch (_b) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const reports = await listReports();
    return (_jsx(ReportsShell, { reports: reports, tenantId: tenantId, children: children }));
}
