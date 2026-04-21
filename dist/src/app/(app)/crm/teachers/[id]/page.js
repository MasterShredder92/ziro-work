import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacherById, getTeacherAvailability } from "@data/teachers";
import { getTeacherSchedule, listEnrollmentsFor } from "@/lib/crm";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav, KpiTile, TableShell } from "../../_components";
export const dynamic = "force-dynamic";
export default async function TeacherProfilePage({ params, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { id } = await params;
    const tenantId = await getCRMTenantId();
    const { data: teacher } = await getTeacherById(id);
    if (!teacher)
        notFound();
    const [schedule, enrollments, availability] = await Promise.all([
        getTeacherSchedule(tenantId, id),
        listEnrollmentsFor(tenantId, { teacher_id: id }),
        getTeacherAvailability(id),
    ]);
    const activeEnrollments = enrollments.filter((e) => e.status === "active");
    const display = (_a = teacher.display_name) !== null && _a !== void 0 ? _a : `${(_b = teacher.first_name) !== null && _b !== void 0 ? _b : ""} ${(_c = teacher.last_name) !== null && _c !== void 0 ? _c : ""}`.trim();
    return (_jsxs(CRMLayout, { title: display || "Teacher", subtitle: `Teacher · ${(_d = teacher.status) !== null && _d !== void 0 ? _d : "—"}`, actions: _jsx("div", { className: "flex flex-wrap gap-2", children: _jsx(Link, { href: `/messages?teacherId=${encodeURIComponent(id)}`, className: "rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20", children: "Message teacher" }) }), children: [_jsx(CRMNav, { current: "teachers" }), _jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [_jsx(KpiTile, { label: "Active students", value: activeEnrollments.length }), _jsx(KpiTile, { label: "Total enrollments", value: enrollments.length }), _jsx(KpiTile, { label: "Scheduled blocks", value: schedule.length }), _jsx(KpiTile, { label: "Availability slots", value: (_f = (_e = availability.data) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0 })] }), _jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Profile" }), _jsxs("dl", { className: "space-y-2 text-sm", children: [_jsx(Row, { label: "Email", value: (_g = teacher.email) !== null && _g !== void 0 ? _g : null }), _jsx(Row, { label: "Phone", value: (_h = teacher.phone) !== null && _h !== void 0 ? _h : null }), _jsx(Row, { label: "Instruments", value: Array.isArray(teacher.instruments)
                                            ? teacher.instruments.join(", ")
                                            : null }), _jsx(Row, { label: "Role", value: (_j = teacher.teacher_role) !== null && _j !== void 0 ? _j : null }), _jsx(Row, { label: "Hire date", value: (_k = teacher.hire_date) !== null && _k !== void 0 ? _k : null })] })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 lg:col-span-2", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Load" }), enrollments.length === 0 ? (_jsx("div", { className: "text-xs text-[#707078]", children: "No enrollments yet." })) : (_jsx(TableShell, { headers: ["Student", "Status", "Start", "End"], children: enrollments.map((e) => {
                                    var _a, _b;
                                    return (_jsxs("tr", { className: "border-b border-[#1c1c1e] last:border-0", children: [_jsx("td", { className: "px-4 py-2 text-[#909098]", children: _jsx(Link, { href: `/crm/students/${e.student_id}`, className: "hover:text-[#00ff88]", children: e.student_id }) }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: e.status }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_a = e.start_date) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_b = e.end_date) !== null && _b !== void 0 ? _b : "—" })] }, e.id));
                                }) }))] })] }), _jsx("h2", { className: "mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]", children: "Schedule (read-only)" }), _jsxs("p", { className: "mb-3 text-xs text-[#707078]", children: [schedule.length, " block", schedule.length === 1 ? "" : "s", " on file \u2014 open Scheduling for changes."] }), schedule.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]", children: "No scheduled blocks." })) : (_jsx(TableShell, { headers: ["Day", "Start", "End", "Status"], children: schedule.map((s) => {
                    var _a, _b, _c, _d;
                    return (_jsxs("tr", { className: "border-b border-[#1c1c1e] last:border-0", children: [_jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_a = s.dayOfWeek) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_b = s.startsAt) !== null && _b !== void 0 ? _b : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_c = s.endsAt) !== null && _c !== void 0 ? _c : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_d = s.status) !== null && _d !== void 0 ? _d : "—" })] }, s.blockId));
                }) }))] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-[#606068]", children: label }), _jsx("dd", { className: "text-[#d4d4d4]", children: value !== null && value !== void 0 ? value : "—" })] }));
}
