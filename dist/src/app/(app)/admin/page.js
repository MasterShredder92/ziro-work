import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getAdminDashboard } from "@/lib/admin/service";
import { KpiCard } from "./components/KpiCard";
import { DataTable } from "./components/DataTable";
import { InvoiceAgingChart } from "./components/InvoiceAgingChart";
import { ScheduleHeatmap } from "./components/ScheduleHeatmap";
import { TeacherLoadChart } from "./components/TeacherLoadChart";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function money(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(cents / 100);
}
function number(n) {
    return new Intl.NumberFormat("en-US").format(n);
}
function formatDate(iso) {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
    catch (_a) {
        return iso;
    }
}
function asString(v, fallback = "—") {
    if (v === null || v === undefined)
        return fallback;
    if (typeof v === "string")
        return v.length > 0 ? v : fallback;
    return String(v);
}
async function resolveTenantId(searchParams) {
    if (searchParams.tenantId && searchParams.tenantId.trim().length > 0) {
        return searchParams.tenantId.trim();
    }
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader && fromHeader.trim().length > 0)
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
const leadColumns = [
    {
        id: "name",
        header: "Name",
        accessor: (l) => {
            const first = asString(l.first_name, "");
            const last = asString(l.last_name, "");
            const composed = `${first} ${last}`.trim();
            return composed.length > 0 ? composed : asString(l.student_name);
        },
    },
    {
        id: "stage",
        header: "Stage",
        accessor: (l) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]", children: asString(l.stage, "inquiry") })),
    },
    {
        id: "instrument",
        header: "Instrument",
        accessor: (l) => asString(l.instrument),
    },
    {
        id: "source",
        header: "Source",
        accessor: (l) => asString(l.source),
    },
    {
        id: "created",
        header: "Created",
        accessor: (l) => formatDate(l.created_at),
        align: "right",
    },
];
const studentColumns = [
    {
        id: "name",
        header: "Student",
        accessor: (s) => `${asString(s.first_name, "")} ${asString(s.last_name, "")}`.trim() ||
            "—",
    },
    {
        id: "instrument",
        header: "Instrument",
        accessor: (s) => asString(s.instrument),
    },
    {
        id: "status",
        header: "Status",
        accessor: (s) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]", children: asString(s.status, "unknown") })),
    },
    {
        id: "enrollment",
        header: "Enrollment",
        accessor: (s) => asString(s.enrollment_type),
    },
    {
        id: "started",
        header: "First lesson",
        accessor: (s) => { var _a; return formatDate((_a = s.first_lesson_date) !== null && _a !== void 0 ? _a : s.created_at); },
        align: "right",
    },
];
const teacherColumns = [
    {
        id: "name",
        header: "Teacher",
        accessor: (t) => {
            const full = asString(t["full_name"], "");
            if (full !== "—")
                return full;
            const first = asString(t["first_name"], "");
            const last = asString(t["last_name"], "");
            const composed = `${first} ${last}`.trim();
            return composed.length > 0 ? composed : asString(t["email"]);
        },
    },
    {
        id: "email",
        header: "Email",
        accessor: (t) => asString(t["email"]),
    },
    {
        id: "instruments",
        header: "Instruments",
        accessor: (t) => {
            const raw = t["instruments"];
            if (Array.isArray(raw))
                return raw.join(", ") || "—";
            return asString(raw);
        },
    },
    {
        id: "status",
        header: "Status",
        accessor: (t) => { var _a; return asString((_a = t["status"]) !== null && _a !== void 0 ? _a : t["active"]); },
    },
];
function latestInvoices(invoices) {
    return invoices.slice(0, 10);
}
function upcomingBlocks(schedule) {
    const today = new Date().toISOString().slice(0, 10);
    return schedule
        .filter((b) => b.block_date && b.block_date >= today)
        .slice(0, 8);
}
export default async function AdminDashboardPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveTenantId(params);
    const data = await getAdminDashboard(tenantId);
    const { kpis, leads, students, teachers, invoices, schedule, aging, heatmap, teacherLoad } = data;
    return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: "Admin dashboard" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Real-time overview of leads, students, teachers, schedule, and billing." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5", children: [_jsx(KpiCard, { label: "Active students", value: number(kpis.activeStudents), sublabel: `${number(kpis.totalStudents)} total enrolled`, accent: "success" }), _jsx(KpiCard, { label: "Active leads", value: number(kpis.activeLeads), sublabel: `${number(kpis.convertedLeadsThisMonth)} converted this month` }), _jsx(KpiCard, { label: "Teachers", value: number(kpis.totalTeachers), sublabel: "Across all locations" }), _jsx(KpiCard, { label: "Lessons this week", value: number(kpis.scheduledLessonsThisWeek), sublabel: "Scheduled, non-cancelled" }), _jsx(KpiCard, { label: "Outstanding AR", value: money(kpis.outstandingInvoiceAmountCents), sublabel: `${number(kpis.overdueInvoiceCount)} overdue invoices`, accent: kpis.overdueInvoiceCount > 0 ? "warning" : "default" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsx(InvoiceAgingChart, { buckets: aging }), _jsx(ScheduleHeatmap, { cells: heatmap })] }), _jsx(TeacherLoadChart, { entries: teacherLoad }), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-2", children: [_jsx(DataTable, { caption: `Leads (${number(leads.length)})`, columns: leadColumns, rows: leads, getRowKey: (l) => l.id, maxRows: 10, emptyLabel: "No leads yet." }), _jsx(DataTable, { caption: `Students (${number(students.length)})`, columns: studentColumns, rows: students, getRowKey: (s) => s.id, maxRows: 10, emptyLabel: "No students yet." })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-2", children: [_jsx(DataTable, { caption: `Teachers (${number(teachers.length)})`, columns: teacherColumns, rows: teachers, getRowKey: (t) => t.id, maxRows: 10, emptyLabel: "No teachers yet." }), _jsx(DataTable, { caption: `Recent invoices (${number(invoices.length)} total)`, columns: [
                            {
                                id: "number",
                                header: "Invoice",
                                accessor: (inv) => { var _a; return asString((_a = inv.invoice_number) !== null && _a !== void 0 ? _a : inv.square_invoice_id); },
                            },
                            {
                                id: "customer",
                                header: "Customer",
                                accessor: (inv) => asString(inv.customer_name),
                            },
                            {
                                id: "status",
                                header: "Status",
                                accessor: (inv) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]", children: asString(inv.status).toLowerCase() })),
                            },
                            {
                                id: "amount",
                                header: "Amount",
                                accessor: (inv) => { var _a; return money((_a = inv.amount_cents) !== null && _a !== void 0 ? _a : 0); },
                                align: "right",
                            },
                            {
                                id: "due",
                                header: "Due",
                                accessor: (inv) => formatDate(inv.due_date),
                                align: "right",
                            },
                        ], rows: latestInvoices(invoices), getRowKey: (inv) => { var _a; return (_a = inv.id) !== null && _a !== void 0 ? _a : inv.square_invoice_id; }, emptyLabel: "No invoices yet." })] }), _jsx(DataTable, { caption: "Upcoming schedule", columns: [
                    {
                        id: "date",
                        header: "Date",
                        accessor: (b) => formatDate(b.block_date),
                    },
                    {
                        id: "time",
                        header: "Time",
                        accessor: (b) => {
                            var _a, _b, _c, _d;
                            return `${(_b = (_a = b.start_time) === null || _a === void 0 ? void 0 : _a.slice(0, 5)) !== null && _b !== void 0 ? _b : "--:--"} – ${(_d = (_c = b.end_time) === null || _c === void 0 ? void 0 : _c.slice(0, 5)) !== null && _d !== void 0 ? _d : "--:--"}`;
                        },
                    },
                    {
                        id: "type",
                        header: "Type",
                        accessor: (b) => asString(b.block_type),
                    },
                    {
                        id: "status",
                        header: "Status",
                        accessor: (b) => asString(b.status),
                    },
                    {
                        id: "teacher",
                        header: "Teacher",
                        accessor: (b) => asString(b.teacher_id),
                    },
                    {
                        id: "room",
                        header: "Room",
                        accessor: (b) => { var _a; return asString((_a = b.room) !== null && _a !== void 0 ? _a : b.room_id); },
                    },
                ], rows: upcomingBlocks(schedule), getRowKey: (b) => b.id, emptyLabel: "No upcoming schedule." }), _jsxs("div", { className: "text-right text-xs text-[var(--z-muted)]", children: ["Tenant: ", tenantId, " \u00B7 Generated ", new Date(kpis.generatedAt).toLocaleString()] })] }));
}
