import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getStudentAttendanceSummary } from "@/lib/attendance/queries";
import { listAttendance } from "@/lib/attendance/queries";
import { resolveStudentContext } from "../guard";
import { AttendanceKpiCards, AttendanceRecordTable, AttendanceSummaryWidget, } from "../../attendance/components";
export const dynamic = "force-dynamic";
export default async function StudentAttendancePortalPage() {
    let ctx;
    try {
        ctx = await resolveStudentContext();
    }
    catch (_a) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Your attendance isn't available right now." }));
    }
    const [summary, combined] = await Promise.all([
        getStudentAttendanceSummary(ctx.studentId, ctx.tenantId),
        listAttendance(ctx.studentId, null, ctx.tenantId),
    ]);
    await logAudit("attendance.surface.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        studentId: ctx.studentId,
        source: "student_portal",
    });
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "My attendance" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "View your attendance history, streaks, and punctuality." })] }), _jsx(AttendanceSummaryWidget, { summary: summary, detailHref: undefined }), _jsx(AttendanceKpiCards, { kpis: summary.kpis, title: "Snapshot" }), _jsx(AttendanceRecordTable, { records: combined.records, sessions: combined.sessions })] }));
}
