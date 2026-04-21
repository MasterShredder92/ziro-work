import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { logAudit } from "@/lib/audit/log";
import { getAttendanceDashboard } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "./guard";
import { AttendanceKpiCards, AttendanceStudentTable, } from "./components";
export const dynamic = "force-dynamic";
export default async function AttendanceDashboardPage({ searchParams, }) {
    var _a;
    let ctx;
    try {
        ctx = await resolveAttendancePageContext();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "You don't have access to the Attendance OS. Please contact your administrator." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const start = typeof resolved.start === "string" ? resolved.start : undefined;
    const end = typeof resolved.end === "string" ? resolved.end : undefined;
    const range = start && end ? { start, end } : undefined;
    const data = await getAttendanceDashboard(ctx.tenantId, range);
    await logAudit("attendance.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        windowStart: data.windowStart,
        windowEnd: data.windowEnd,
        students: data.students.length,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Attendance Dashboard" }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [data.windowStart, " \u2192 ", data.windowEnd, " \u00B7 ", data.students.length, " ", "students"] })] }), _jsx(AttendanceKpiCards, { kpis: data.totals, title: "Workspace totals" })] }), _jsxs("section", { id: "at-risk", className: "space-y-2 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "At-risk students" }), _jsx(AttendanceStudentTable, { rows: data.atRisk, emptyLabel: "No high or critical risk students in this window." })] }), _jsxs("section", { id: "students", className: "space-y-2 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "All students" }), _jsx(AttendanceStudentTable, { rows: data.students, emptyLabel: "No student attendance records in this window." })] }), _jsxs("section", { id: "sessions", className: "space-y-2 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Upcoming & recent sessions" }), data.upcomingSessions.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No sessions in this window yet." })) : (_jsx("div", { className: "overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]", children: _jsxs("tr", { className: "text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2", children: "Date" }), _jsx("th", { className: "px-4 py-2", children: "Time" }), _jsx("th", { className: "px-4 py-2", children: "Status" }), _jsx("th", { className: "px-4 py-2", children: "Class" }), _jsx("th", { className: "px-4 py-2" })] }) }), _jsx("tbody", { children: data.upcomingSessions.slice(0, 25).map((s) => {
                                        var _a, _b, _c, _d, _e;
                                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)]", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: s.session_date }), _jsxs("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: [(_b = (_a = s.start_time) === null || _a === void 0 ? void 0 : _a.slice(0, 5)) !== null && _b !== void 0 ? _b : "—", " \u2013", " ", (_d = (_c = s.end_time) === null || _c === void 0 ? void 0 : _c.slice(0, 5)) !== null && _d !== void 0 ? _d : "—"] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: s.status }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_e = s.class_label) !== null && _e !== void 0 ? _e : "—" }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(Link, { href: `/attendance/session/${s.id}`, className: "text-[#00ffd0] hover:underline text-xs font-semibold", children: "Roster \u2192" }) })] }, s.id));
                                    }) })] }) }))] })] }));
}
