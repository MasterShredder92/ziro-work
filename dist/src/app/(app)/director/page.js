import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getDirectorLocation, listLocations } from "@/lib/director/queries";
import { getDirectorDashboard } from "@/lib/director/service";
import { KpiCard } from "./components/KpiCard";
import { DataTable } from "./components/DataTable";
import { BillingSummary } from "./components/BillingSummary";
import { ScheduleHeatmap } from "./components/ScheduleHeatmap";
import { TeacherLoadChart } from "./components/TeacherLoadChart";
export const dynamic = "force-dynamic";
function formatNumber(n) {
    return new Intl.NumberFormat("en-US").format(n);
}
function formatCurrencyCents(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format((cents !== null && cents !== void 0 ? cents : 0) / 100);
}
function formatDate(value) {
    if (!value)
        return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function StageBadge({ stage }) {
    const label = stage !== null && stage !== void 0 ? stage : "new";
    const tone = label === "enrolled"
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : label === "lost"
            ? "bg-red-500/15 text-red-300 border-red-500/30"
            : label === "trial"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`, children: label }));
}
function StatusBadge({ status }) {
    const label = status !== null && status !== void 0 ? status : "—";
    const tone = label === "active"
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : label === "inactive"
            ? "bg-red-500/15 text-red-300 border-red-500/30"
            : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`, children: label }));
}
export default async function DirectorDashboardPage({ searchParams, }) {
    var _a, _b, _c, _d, _e;
    let session = null;
    try {
        session = await requireRole("director")();
    }
    catch (_f) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const resolved = (_b = (await searchParams)) !== null && _b !== void 0 ? _b : {};
    const rawLocation = resolved.locationId;
    let locationId = typeof rawLocation === "string" && rawLocation.length > 0
        ? rawLocation
        : null;
    if (!locationId) {
        try {
            const locations = await listLocations(tenantId);
            locationId = (_d = (_c = locations[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null;
        }
        catch (_g) {
            locationId = null;
        }
    }
    if (!locationId) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "No locations found" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Configure at least one active location to view the director dashboard." })] }));
    }
    const location = await getDirectorLocation(tenantId, locationId);
    try {
        await assertTenantAccess(location.tenant_id);
    }
    catch (_h) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to this location." })] }));
    }
    const data = await getDirectorDashboard(location.id, location.tenant_id);
    await logAudit("director.dashboard.view", {
        locationId: location.id,
        tenantId: location.tenant_id,
        profileId: (_e = session === null || session === void 0 ? void 0 : session.userId) !== null && _e !== void 0 ? _e : null,
        generatedAt: data.generatedAt,
        source: "page",
    });
    const leadColumns = [
        {
            id: "name",
            header: "Lead",
            cell: (row) => {
                var _a, _b;
                return (_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: [row.first_name, row.last_name].filter(Boolean).join(" ") ||
                                row.parent_name ||
                                "Unnamed" }), _jsx("div", { className: "text-xs text-[var(--z-muted)] truncate", children: (_b = (_a = row.email) !== null && _a !== void 0 ? _a : row.phone) !== null && _b !== void 0 ? _b : "—" })] }));
            },
        },
        {
            id: "instrument",
            header: "Instrument",
            width: "140px",
            cell: (row) => { var _a; return (_a = row.instrument) !== null && _a !== void 0 ? _a : "—"; },
        },
        {
            id: "source",
            header: "Source",
            width: "140px",
            cell: (row) => { var _a, _b; return (_b = (_a = row.source) !== null && _a !== void 0 ? _a : row.how_heard) !== null && _b !== void 0 ? _b : "—"; },
        },
        {
            id: "stage",
            header: "Stage",
            width: "120px",
            cell: (row) => _jsx(StageBadge, { stage: row.stage }),
        },
        {
            id: "age",
            header: "Age",
            width: "80px",
            align: "right",
            cell: (row) => `${row.age_days}d`,
        },
        {
            id: "created",
            header: "Created",
            width: "120px",
            align: "right",
            cell: (row) => formatDate(row.created_at),
        },
    ];
    const studentColumns = [
        {
            id: "name",
            header: "Student",
            cell: (row) => {
                var _a, _b, _c;
                return (_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: `${(_a = row.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = row.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || "Unnamed" }), _jsx("div", { className: "text-xs text-[var(--z-muted)] truncate", children: (_c = row.email) !== null && _c !== void 0 ? _c : "—" })] }));
            },
        },
        {
            id: "instrument",
            header: "Instrument",
            width: "140px",
            cell: (row) => { var _a; return (_a = row.instrument) !== null && _a !== void 0 ? _a : "—"; },
        },
        {
            id: "enrollment",
            header: "Type",
            width: "120px",
            cell: (row) => {
                var _a;
                return (_a = row
                    .enrollment_type) !== null && _a !== void 0 ? _a : "—";
            },
        },
        {
            id: "blocks",
            header: "Blocks/wk",
            width: "100px",
            align: "right",
            cell: (row) => {
                var _a;
                return String((_a = row.blocks_per_week) !== null && _a !== void 0 ? _a : 0);
            },
        },
        {
            id: "status",
            header: "Status",
            width: "110px",
            cell: (row) => { var _a; return _jsx(StatusBadge, { status: (_a = row.status) !== null && _a !== void 0 ? _a : undefined }); },
        },
        {
            id: "created",
            header: "Enrolled",
            width: "120px",
            align: "right",
            cell: (row) => formatDate(row.created_at),
        },
    ];
    const teacherColumns = [
        {
            id: "name",
            header: "Teacher",
            cell: (row) => {
                var _a;
                return (_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: row.name }), _jsx("div", { className: "text-xs text-[var(--z-muted)] truncate", children: (_a = row.email) !== null && _a !== void 0 ? _a : "—" })] }));
            },
        },
        {
            id: "students",
            header: "Active students",
            width: "150px",
            align: "right",
            cell: (row) => formatNumber(row.activeStudents),
        },
        {
            id: "lessons",
            header: "Weekly lessons",
            width: "150px",
            align: "right",
            cell: (row) => formatNumber(row.weeklyLessons),
        },
        {
            id: "hours",
            header: "Weekly hours",
            width: "140px",
            align: "right",
            cell: (row) => `${(row.weeklyMinutes / 60).toFixed(1)}h`,
        },
        {
            id: "utilization",
            header: "Utilization",
            width: "130px",
            align: "right",
            cell: (row) => `${row.utilizationPct}%`,
        },
        {
            id: "status",
            header: "Status",
            width: "110px",
            cell: (row) => { var _a; return _jsx(StatusBadge, { status: (_a = row.status) !== null && _a !== void 0 ? _a : undefined }); },
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-4 scroll-mt-24", children: [_jsx("header", { className: "flex items-end justify-between gap-3 flex-wrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Overview" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: data.location.name }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(KpiCard, { label: "Active students", value: formatNumber(data.kpis.activeStudents), sublabel: `${formatNumber(data.kpis.totalStudents)} total`, accent: "success" }), _jsx(KpiCard, { label: "New this month", value: formatNumber(data.kpis.newStudentsThisMonth), trend: data.kpis.newStudentsThisMonth > 0 ? "up" : "flat", trendLabel: data.kpis.newStudentsThisMonth > 0
                                    ? `${data.kpis.newStudentsThisMonth} enrolled`
                                    : "No enrollments yet" }), _jsx(KpiCard, { label: "Open leads", value: formatNumber(data.kpis.openLeads), sublabel: `${formatNumber(data.kpis.totalLeads)} total`, accent: data.kpis.openLeads > 10 ? "warning" : "default" }), _jsx(KpiCard, { label: "Conversion rate", value: `${data.kpis.conversionRate}%`, sublabel: `${formatNumber(data.kpis.convertedLeads)} converted`, accent: data.kpis.conversionRate >= 30
                                    ? "success"
                                    : data.kpis.conversionRate >= 15
                                        ? "default"
                                        : "warning" }), _jsx(KpiCard, { label: "Weekly lessons", value: formatNumber(data.kpis.weeklyLessonCount), sublabel: `${(data.kpis.weeklyLessonMinutes / 60).toFixed(1)}h total` }), _jsx(KpiCard, { label: "MTD revenue", value: formatCurrencyCents(data.kpis.monthToDateRevenueCents), sublabel: `${formatCurrencyCents(data.kpis.outstandingInvoiceAmountCents)} outstanding`, accent: data.kpis.monthToDateRevenueCents > 0 ? "success" : "default" })] })] }), _jsxs("section", { id: "leads", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { className: "flex items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Pipeline" }), _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Leads" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Showing ", Math.min(data.leads.length, 100), " of", " ", formatNumber(data.leads.length)] })] }), _jsx(DataTable, { columns: leadColumns, rows: data.leads.slice(0, 100), getRowKey: (row) => row.id, emptyMessage: "No leads for this location." })] }), _jsxs("section", { id: "students", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { className: "flex items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Enrollment" }), _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Students" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [formatNumber(data.kpis.activeStudents), " active \u00B7", " ", formatNumber(data.kpis.inactiveStudents), " inactive"] })] }), _jsx(DataTable, { columns: studentColumns, rows: data.students.slice(0, 200), getRowKey: (row) => row.id, emptyMessage: "No students for this location." })] }), _jsxs("section", { id: "teachers", className: "grid grid-cols-1 lg:grid-cols-5 gap-4 scroll-mt-24", children: [_jsxs("div", { className: "lg:col-span-3 space-y-3", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Roster" }), _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Teachers" })] }), _jsx(DataTable, { columns: teacherColumns, rows: data.teachers, getRowKey: (row) => row.id, emptyMessage: "No teachers assigned to this location." })] }), _jsx("div", { className: "lg:col-span-2", children: _jsx(TeacherLoadChart, { teachers: data.teachers }) })] }), _jsx("section", { id: "schedule", className: "space-y-3 scroll-mt-24", children: _jsx(ScheduleHeatmap, { schedule: data.schedule }) }), _jsx("section", { id: "billing", className: "space-y-3 scroll-mt-24", children: _jsx(BillingSummary, { billing: data.billing }) })] }));
}
