import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getCRMKpis } from "@/lib/crm";
import { KpiTile } from "./_components";
export async function CRMKpiSection({ tenantId }) {
    let kpis;
    try {
        kpis = await getCRMKpis(tenantId);
    }
    catch (err) {
        return (_jsxs("div", { className: "rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-100", children: [_jsx("div", { className: "font-semibold", children: "Could not load KPIs" }), _jsx("div", { className: "mt-1 text-xs text-red-200/90", children: err instanceof Error ? err.message : "Unexpected error" })] }));
    }
    return (_jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: [_jsx(KpiTile, { label: "Active students", value: kpis.activeStudents }), _jsx(KpiTile, { label: "Families", value: kpis.families }), _jsx(KpiTile, { label: "Active enrollments", value: kpis.activeEnrollments, hint: "Teacher\u2013student enrollments marked active" }), _jsx(KpiTile, { label: "Open leads", value: kpis.openLeads }), _jsx(KpiTile, { label: "Active teachers", value: kpis.activeTeachers }), _jsx(KpiTile, { label: "Enrolled (30d)", value: kpis.enrolledLast30d, hint: "New enrollments in the last 30 days" })] }));
}
