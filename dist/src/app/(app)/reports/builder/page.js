import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { REPORT_SOURCES } from "@/lib/reports/types";
import { ReportBuilder } from "../components/ReportBuilder";
export const dynamic = "force-dynamic";
export default async function ReportBuilderPage() {
    var _a;
    let session = null;
    try {
        session = await requirePermission("reports.write")();
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
    if (!session) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You need reports.write permission to build custom reports." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Reporting OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Report builder" }), _jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[720px]", children: "Pick a data source, filter it, group it, and preview the result. Save to add the report to your dashboard." })] }), _jsx(ReportBuilder, { tenantId: tenantId, sources: REPORT_SOURCES })] }));
}
