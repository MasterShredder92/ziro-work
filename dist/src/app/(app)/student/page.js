import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { resolveStudentContext } from "./guard";
import { getStudentDashboard } from "@/lib/student/service";
import { toStudentDisplayProfile } from "@/lib/student/types";
import { logAudit } from "@/lib/audit/log";
import { getStudentAssessmentSummary } from "@/lib/assessments/service";
import { canForRole } from "@/lib/auth/permissions";
import { AssessmentsSection, BillingList, LessonList, MessageList, ScheduleList, } from "./components";
export const dynamic = "force-dynamic";
function todayIso() {
    return new Date().toISOString().slice(0, 10);
}
function isBeforeToday(date) {
    if (!date)
        return true;
    return date < todayIso();
}
export default async function StudentHomePage() {
    var _a;
    let ctx;
    try {
        ctx = await resolveStudentContext();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unable to resolve student context.";
        return (_jsxs("div", { className: "mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Student profile not found" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: message === "STUDENT_NOT_FOUND"
                        ? "Your account is not yet connected to a student record. Please contact your studio administrator."
                        : message === "FORBIDDEN"
                            ? "You do not have access to this student."
                            : message })] }));
    }
    const [data, assessmentSummary] = await Promise.all([
        getStudentDashboard(ctx.studentId),
        getStudentAssessmentSummary(ctx.studentId, ctx.tenantId).catch(() => null),
    ]);
    await logAudit("student.dashboard.page.view", {
        studentId: ctx.studentId,
        tenantId: ctx.tenantId,
        userId: ctx.session.userId,
    });
    const profile = toStudentDisplayProfile(data.student);
    const today = todayIso();
    const todaysSchedule = data.schedule.filter((b) => b.block_date === today);
    const upcomingSchedule = data.schedule.filter((b) => !isBeforeToday(b.block_date));
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-6xl flex-col gap-6", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsxs("h1", { className: "text-xl font-semibold text-[var(--z-fg)] sm:text-2xl", children: ["Welcome back", profile ? `, ${profile.firstName}` : ""] }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [(profile === null || profile === void 0 ? void 0 : profile.instrument) ? `${profile.instrument} · ` : "", (_a = profile === null || profile === void 0 ? void 0 : profile.teacherName) !== null && _a !== void 0 ? _a : "Your teacher will be assigned shortly."] })] }), _jsxs("section", { id: "schedule", className: "flex flex-col gap-3 scroll-mt-20", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Today" }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [todaysSchedule.length, " session", todaysSchedule.length === 1 ? "" : "s"] })] }), _jsx(ScheduleList, { schedule: todaysSchedule.length > 0
                            ? todaysSchedule
                            : upcomingSchedule.slice(0, 5), emptyLabel: "Nothing on the books today." })] }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs("div", { id: "lessons", className: "flex flex-col gap-3 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Recent lessons" }), _jsx(LessonList, { lessons: data.lessons, maxRows: 10 })] }), _jsxs("div", { id: "messages", className: "flex flex-col gap-3 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Messages" }), _jsx(MessageList, { messages: data.messages, maxRows: 10 })] })] }), _jsxs("section", { id: "billing", className: "flex flex-col gap-3 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Billing" }), _jsx(BillingList, { invoices: data.billing, summary: data.billingSummary, maxRows: 10 })] }), assessmentSummary ? (_jsxs("section", { id: "assessments", className: "flex flex-col gap-3 scroll-mt-20", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Assessments" }), _jsx(AssessmentsSection, { summary: assessmentSummary, canRun: canForRole(ctx.session.role, "assessments.run") })] })) : null, _jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Upcoming schedule" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Next 14 days" })] }), _jsx("div", { className: "p-4", children: _jsx(ScheduleList, { schedule: upcomingSchedule, maxRows: 20, emptyLabel: "No upcoming sessions in the next two weeks." }) })] })] }));
}
