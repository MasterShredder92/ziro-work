import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { listReports } from "@/lib/reports/service";
import { listSavedReports } from "@/lib/reports/savedReports";
import { computeSnapshot } from "@/lib/reports/kpis";
import { ReportList } from "./components/ReportList";
import { SavedReportList } from "./components/SavedReportList";
import { KpiSnapshotGrid } from "./components/KpiSnapshotGrid";
export const dynamic = "force-dynamic";
export default async function ReportsIndexPage() {
    var _a, _b;
    let session = null;
    try {
        session = await requirePermission("reports.read")();
    }
    catch (_c) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_d) {
            return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to reports for this tenant." })] }));
        }
    }
    const reports = await listReports();
    const saved = session
        ? await listSavedReports(tenantId).catch(() => [])
        : [];
    const snapshot = session
        ? await computeSnapshot(tenantId).catch(() => ({ tenantId, range: { from: "", to: "" }, values: [], generatedAt: new Date().toISOString() }))
        : { tenantId, range: { from: "", to: "" }, values: [], generatedAt: new Date().toISOString() };
    await logAudit("reports.list.view", {
        tenantId,
        profileId: (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null,
        count: reports.length,
        savedCount: saved.length,
        kpiCount: snapshot.values.length,
    });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("section", { className: "space-y-2", children: _jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Reporting OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Reports & analytics" }), _jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[640px]", children: "KPIs, built-in reports, saved dashboards, and exports \u2014 all scoped to your tenant with audited runs." })] }), _jsx(Link, { href: "/reports/builder", className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] bg-[#00ff88] px-3 text-xs font-semibold text-black hover:bg-[#00e077]", children: "New custom report" })] }) }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "KPI snapshot" }), _jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: ["Last 90 days \u00B7 generated ", new Date(snapshot.generatedAt).toLocaleString()] })] }), _jsx(KpiSnapshotGrid, { values: snapshot.values })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Built-in reports" }), _jsx(ReportList, { reports: reports })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Saved reports" }) }), _jsx(SavedReportList, { reports: saved })] })] }));
}
