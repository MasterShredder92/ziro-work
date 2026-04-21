import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { resolveTeacherContext } from "./guard";
import { getTeacherDashboard } from "@/lib/teacher/service";
import { toTeacherDisplayProfile } from "@/lib/teacher/types";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentDashboard } from "@/lib/assessments/service";
import { AssessmentList } from "@/app/(app)/assessments/components";
import { ScheduleList } from "./components/ScheduleList";
import { StudentList } from "./components/StudentList";
import { LessonNotesList } from "./components/LessonNotesList";
import { MessageList } from "./components/MessageList";
export const dynamic = "force-dynamic";
export default async function TeacherHomePage() {
    let ctx;
    try {
        ctx = await resolveTeacherContext();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unable to resolve teacher context.";
        return (_jsxs("div", { className: "mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Teacher profile not found" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: message === "TEACHER_NOT_FOUND"
                        ? "Your account does not have a linked teacher record yet. Please contact your studio administrator."
                        : message === "FORBIDDEN"
                            ? "You do not have access to this teacher."
                            : message })] }));
    }
    const [data, assessmentDashboard] = await Promise.all([
        getTeacherDashboard(ctx.teacherId),
        getAssessmentDashboard(ctx.tenantId).catch(() => null),
    ]);
    await logAudit("teacher.dashboard.page.view", {
        teacherId: ctx.teacherId,
        tenantId: ctx.tenantId,
        userId: ctx.session.userId,
    });
    const profile = toTeacherDisplayProfile(data.teacher);
    return (_jsxs("div", { className: "mx-auto flex max-w-7xl flex-col gap-6", children: [_jsxs("section", { className: "flex flex-col gap-1", children: [_jsxs("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: ["Welcome back", profile ? `, ${profile.fullName.split(" ")[0]}` : ""] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Here is your teaching day at a glance." })] }), _jsxs("section", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Today", value: countToday(data.schedule), suffix: "lessons" }), _jsx(StatCard, { label: "This week", value: countThisWeek(data.schedule), suffix: "lessons" }), _jsx(StatCard, { label: "Active students", value: data.students.filter((s) => s.status === "active").length, suffix: "students" }), _jsx(StatCard, { label: "Recent notes", value: data.lessons.length, suffix: "entries" })] }), _jsx("div", { id: "schedule", className: "scroll-mt-20", children: _jsx(ScheduleList, { schedule: data.schedule, title: "Today's schedule", onlyToday: true, maxRows: 12 }) }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx("div", { id: "students", className: "scroll-mt-20", children: _jsx(StudentList, { students: data.students, maxRows: 15 }) }), _jsx("div", { id: "messages", className: "scroll-mt-20", children: _jsx(MessageList, { messages: data.messages, maxRows: 10 }) })] }), _jsx("div", { id: "lessons", className: "scroll-mt-20", children: _jsx(LessonNotesList, { lessons: data.lessons, students: data.students, maxRows: 10 }) }), assessmentDashboard ? (_jsxs("section", { id: "assessments", className: "scroll-mt-20 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Assessments" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [assessmentDashboard.kpis.totalAssessments, " assessments \u00B7", " ", assessmentDashboard.kpis.totalAttempts, " attempts \u00B7", " ", assessmentDashboard.kpis.averageScorePct, "% avg"] })] }), _jsx(Link, { href: "/assessments", className: "text-xs font-medium text-[#00ff88] hover:underline", children: "Open assessments OS \u2192" })] }), _jsx("div", { className: "p-4", children: _jsx(AssessmentList, { summaries: assessmentDashboard.assessments.slice(0, 8), canWrite: true }) })] })) : null, _jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: _jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Upcoming schedule" }) }), _jsx("div", { className: "p-4", children: _jsx(ScheduleList, { schedule: data.schedule.filter((b) => !isBeforeToday(b.block_date)), title: "Next 14 days", maxRows: 20 }) })] })] }));
}
function StatCard({ label, value, suffix, }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "mt-1 flex items-baseline gap-1.5", children: [_jsx("span", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: value }), _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: suffix })] })] }));
}
function countToday(schedule) {
    const today = new Date().toISOString().slice(0, 10);
    return schedule.filter((b) => b.block_date === today && b.status !== "cancelled").length;
}
function countThisWeek(schedule) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return schedule.filter((b) => {
        if (!b.block_date || b.status === "cancelled")
            return false;
        const d = new Date(`${b.block_date}T00:00:00`);
        return d >= start && d < end;
    }).length;
}
function isBeforeToday(date) {
    if (!date)
        return true;
    const today = new Date().toISOString().slice(0, 10);
    return date < today;
}
