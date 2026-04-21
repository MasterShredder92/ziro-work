import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { listExportJobs } from "@/lib/reports/exportService";
import { ExportHistoryTable } from "../components/ExportHistoryTable";
export const dynamic = "force-dynamic";
export default async function ExportHistoryPage() {
    var _a;
    let session = null;
    try {
        session = await requirePermission("reports.read")();
    }
    catch (_b) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_c) {
            session = null;
        }
    }
    const jobs = session ? await listExportJobs(tenantId, { limit: 100 }).catch(() => []) : [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Reporting OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Export history" }), _jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[720px]", children: "Every CSV, XLSX, and PDF export queued for this tenant. Files are retained for 24 hours after completion." })] }), _jsx(ExportHistoryTable, { jobs: jobs, tenantId: tenantId })] }));
}
