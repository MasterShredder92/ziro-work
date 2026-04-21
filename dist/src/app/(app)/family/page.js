import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ensureFamilyAccess } from "./guard";
import { getFamilyProfile, resolveCurrentFamilyId, } from "@/lib/family/queries";
import { getFamilyDashboard } from "@/lib/family/service";
import { toFamilyDisplayProfile } from "@/lib/family/types";
import { getStudentAssessmentSummary } from "@/lib/assessments/service";
import { AttemptList } from "@/app/(app)/assessments/components";
import { BillingList, MessageList, ScheduleList, StudentList, } from "./components";
export const dynamic = "force-dynamic";
function todayIso() {
    return new Date().toISOString().slice(0, 10);
}
function isoDaysAhead(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}
export default async function FamilyDashboardPage() {
    var _a;
    const session = await ensureFamilyAccess();
    const familyId = await resolveCurrentFamilyId(session.userId, session.tenantId);
    if (!familyId) {
        return (_jsx("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-3 p-6", children: _jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "No family profile linked" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Your account isn't yet connected to a family record. Please contact your studio administrator." })] }) }));
    }
    const data = await getFamilyDashboard(familyId);
    const family = (_a = data.family) !== null && _a !== void 0 ? _a : (await getFamilyProfile(session.userId));
    const profile = toFamilyDisplayProfile(family);
    const assessmentSummaries = await Promise.all(data.students.map((s) => getStudentAssessmentSummary(s.id, session.tenantId).catch(() => null)));
    const today = todayIso();
    const windowEnd = isoDaysAhead(14);
    const upcoming14 = data.schedule.filter((b) => { var _a, _b; return ((_a = b.block_date) !== null && _a !== void 0 ? _a : "") >= today && ((_b = b.block_date) !== null && _b !== void 0 ? _b : "") <= windowEnd; });
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-7xl flex-col gap-6", children: [_jsxs("section", { className: "flex flex-col gap-1", children: [_jsxs("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: ["Welcome", profile ? `, ${profile.familyName}` : ""] }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [data.students.length, " student", data.students.length === 1 ? "" : "s", " \u00B7 ", data.schedule.length, " ", "upcoming event", data.schedule.length === 1 ? "" : "s"] })] }), _jsxs("section", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Today", value: data.schedule.filter((b) => b.block_date === today && b.status !== "cancelled").length, suffix: "lessons" }), _jsx(StatCard, { label: "Next 14 days", value: upcoming14.length, suffix: "lessons" }), _jsx(StatCard, { label: "Active students", value: data.students.filter((s) => s.status === "active").length, suffix: "students" }), _jsx(StatCard, { label: "Open balance", value: `$${(data.billingSummary.balanceCents / 100).toFixed(2)}` })] }), _jsx("div", { id: "students", className: "scroll-mt-20", children: _jsx(StudentList, { students: data.students, maxRows: 20 }) }), _jsx("div", { id: "schedule", className: "scroll-mt-20", children: _jsx(ScheduleList, { schedule: data.schedule, title: "Today's schedule", onlyToday: true, maxRows: 12, emptyLabel: "No lessons today." }) }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx("div", { id: "messages", className: "scroll-mt-20", children: _jsx(MessageList, { messages: data.messages, maxRows: 10 }) }), _jsx("div", { id: "billing", className: "scroll-mt-20", children: _jsx(BillingList, { invoices: data.billing, summary: data.billingSummary, title: "Billing summary", maxRows: 10 }) })] }), assessmentSummaries.some((s) => s && s.attempts.length > 0) ? (_jsxs("section", { id: "assessments", className: "scroll-mt-20 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Assessments" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["Recent attempts across ", data.students.length, " student", data.students.length === 1 ? "" : "s"] })] }), _jsx("div", { className: "space-y-4 p-4", children: assessmentSummaries.map((summary, i) => {
                            if (!summary)
                                return null;
                            const student = data.students[i];
                            if (!student)
                                return null;
                            const recent = summary.attempts.slice(0, 5);
                            const displayName = student.display_name || student.id;
                            return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: displayName }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [summary.totals.completed, " completed \u00B7", " ", summary.totals.averageScorePct
                                                        ? `${summary.totals.averageScorePct}% avg`
                                                        : "—"] })] }), _jsx(AttemptList, { attempts: recent, canGrade: false })] }, student.id));
                        }) })] })) : null, _jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: _jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Upcoming schedule" }) }), _jsx("div", { className: "p-4", children: _jsx(ScheduleList, { schedule: upcoming14, title: "Next 14 days", maxRows: 30, emptyLabel: "Nothing scheduled in the next 14 days." }) })] })] }));
}
function StatCard({ label, value, suffix, }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "mt-1 flex items-baseline gap-1.5", children: [_jsx("span", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: value }), suffix ? (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: suffix })) : null] })] }));
}
