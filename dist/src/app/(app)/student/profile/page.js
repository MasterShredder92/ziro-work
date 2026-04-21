import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { getFamilyById } from "@data/families";
import { getNextLessonLabelsForStudents, getStudentSchedule, getStudentProgressSummary, listEnrollmentsFor, } from "@/lib/crm";
import { resolveStudentContext } from "../guard";
export const dynamic = "force-dynamic";
export default async function StudentPortalProfilePage() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let ctx;
    try {
        ctx = await resolveStudentContext();
    }
    catch (_k) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Your profile isn't available right now. Please contact your administrator." }));
    }
    const { student, tenantId } = ctx;
    const [schedule, progress, enrollments, familyRaw, nextLessonMap] = await Promise.all([
        getStudentSchedule(tenantId, student.id),
        getStudentProgressSummary(tenantId, student.id),
        listEnrollmentsFor(tenantId, { student_id: student.id }),
        student.family_id ? getFamilyById(student.family_id, tenantId) : null,
        getNextLessonLabelsForStudents(tenantId, [student.id]),
    ]);
    const nextLesson = nextLessonMap[student.id];
    const family = (familyRaw !== null && familyRaw !== void 0 ? familyRaw : null);
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-6 p-2", children: [_jsxs("header", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "My profile" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Read-only view of your information as your school has it on file." })] }), _jsx(Link, { href: `/schedule/student?studentId=${encodeURIComponent(student.id)}`, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10", children: "Open schedule" })] }), _jsxs("section", { className: "grid gap-3 md:grid-cols-4", children: [_jsx(Kpi, { label: "Sessions / month", value: (_a = student.sessions_per_month) !== null && _a !== void 0 ? _a : 0 }), _jsx(Kpi, { label: "Blocks / week", value: (_b = student.blocks_per_week) !== null && _b !== void 0 ? _b : 0 }), _jsx(Kpi, { label: "Goals", value: `${progress.completedGoals}/${progress.goalsCount}` }), _jsx(Kpi, { label: "Skills tracked", value: progress.skillsCount })] }), _jsxs("section", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs(Card, { title: "Profile", children: [_jsx(Row, { label: "Name", value: `${student.first_name} ${student.last_name}` }), _jsx(Row, { label: "Email", value: (_c = student.email) !== null && _c !== void 0 ? _c : null }), _jsx(Row, { label: "Phone", value: (_d = student.phone) !== null && _d !== void 0 ? _d : null }), _jsx(Row, { label: "Instrument", value: (_e = student.instrument) !== null && _e !== void 0 ? _e : null }), _jsx(Row, { label: "Enrollment type", value: (_f = student.enrollment_type) !== null && _f !== void 0 ? _f : null }), _jsx(Row, { label: "Start date", value: (_g = student.start_date) !== null && _g !== void 0 ? _g : null }), _jsx(Row, { label: "Next lesson", value: nextLesson !== null && nextLesson !== void 0 ? nextLesson : null })] }), _jsx(Card, { title: "Family", children: family ? (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: family.name }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [(_h = family.primary_email) !== null && _h !== void 0 ? _h : "—", " \u00B7 ", (_j = family.primary_phone) !== null && _j !== void 0 ? _j : "—"] })] })) : (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Not linked to a family." })) })] }), _jsx(Card, { title: "Schedule", children: schedule.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No scheduled lessons." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)] text-sm", children: schedule.map((s) => {
                        var _a, _b, _c, _d;
                        return (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { children: (_a = s.dayOfWeek) !== null && _a !== void 0 ? _a : "—" }), _jsxs("span", { className: "text-[var(--z-muted)]", children: [(_b = s.startsAt) !== null && _b !== void 0 ? _b : "—", " \u2192 ", (_c = s.endsAt) !== null && _c !== void 0 ? _c : "—"] }), _jsx("span", { className: "text-[var(--z-muted)]", children: (_d = s.status) !== null && _d !== void 0 ? _d : "—" })] }, s.blockId));
                    }) })) }), _jsx(Card, { title: "Enrollments", children: enrollments.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No active enrollments." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)] text-sm", children: enrollments.map((e) => {
                        var _a, _b;
                        return (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { children: e.status }), _jsxs("span", { className: "text-[var(--z-muted)]", children: [(_a = e.start_date) !== null && _a !== void 0 ? _a : "—", " \u2192 ", (_b = e.end_date) !== null && _b !== void 0 ? _b : "—"] })] }, e.id));
                    }) })) })] }));
}
function Kpi({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
function Card({ title, children, }) {
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[var(--z-fg)]", children: title }), children] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] py-1.5 last:border-0 text-sm", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("dd", { className: "text-[var(--z-fg)]", children: value !== null && value !== void 0 ? value : "—" })] }));
}
