import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getStudentAttendancePageData } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "../guard";
import { AttendanceKpiCards, AttendanceRecordTable, AttendanceSummaryWidget, } from "../components";
export const dynamic = "force-dynamic";
export default async function StudentAttendancePage({ params, searchParams, }) {
    var _a;
    const { studentId } = await params;
    let ctx;
    try {
        ctx = await resolveAttendancePageContext();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "You don't have access to attendance for this student." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const start = typeof resolved.start === "string" ? resolved.start : undefined;
    const end = typeof resolved.end === "string" ? resolved.end : undefined;
    const range = start && end ? { start, end } : undefined;
    const data = await getStudentAttendancePageData(studentId, ctx.tenantId, range);
    const name = data.student
        ? [data.student.first_name, data.student.last_name].filter(Boolean).join(" ")
        : studentId;
    await logAudit("attendance.student.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        studentId,
        records: data.records.length,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: name || studentId }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Attendance history \u00B7 streaks \u00B7 flags" })] }), _jsxs("section", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsx(AttendanceKpiCards, { kpis: data.summary.kpis }), _jsx(AttendanceRecordTable, { records: data.records, sessions: data.sessions })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(AttendanceSummaryWidget, { summary: data.summary, studentId: studentId }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Streaks" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[var(--z-muted)] text-xs", children: "Current present" }), _jsxs("div", { className: "text-[var(--z-fg)] font-semibold", children: ["+", data.summary.currentPresentStreak] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[var(--z-muted)] text-xs", children: "Current absent" }), _jsxs("div", { className: "text-[var(--z-fg)] font-semibold", children: ["-", data.summary.currentAbsentStreak] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[var(--z-muted)] text-xs", children: "Longest present" }), _jsxs("div", { className: "text-[var(--z-fg)] font-semibold", children: ["+", data.summary.longestPresentStreak] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[var(--z-muted)] text-xs", children: "Longest absent" }), _jsxs("div", { className: "text-[var(--z-fg)] font-semibold", children: ["-", data.summary.longestAbsentStreak] })] })] })] })] })] })] }));
}
