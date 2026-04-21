import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { getTeacherSchedule, listEnrollmentsFor, summarizeTeacherScheduleHeadline, } from "@/lib/crm";
import { resolveTeacherContext } from "../guard";
export const dynamic = "force-dynamic";
export default async function TeacherPortalProfilePage() {
    var _a, _b, _c, _d, _e;
    let ctx;
    try {
        ctx = await resolveTeacherContext();
    }
    catch (_f) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Your profile isn't available right now. Please contact your administrator." }));
    }
    const { tenantId, teacherId } = ctx;
    const teacher = ctx.teacher;
    const [schedule, enrollments, scheduleHeadline] = await Promise.all([
        getTeacherSchedule(tenantId, teacherId),
        listEnrollmentsFor(tenantId, { teacher_id: teacherId }),
        summarizeTeacherScheduleHeadline(tenantId, teacherId),
    ]);
    const activeEnrollments = enrollments.filter((e) => e.status === "active");
    const weeklyLoadMinutes = schedule.reduce((sum, block) => {
        if (!block.startsAt || !block.endsAt)
            return sum;
        const [sh, sm] = block.startsAt.split(":").map(Number);
        const [eh, em] = block.endsAt.split(":").map(Number);
        const minutes = eh * 60 + em - (sh * 60 + sm);
        return sum + (isFinite(minutes) ? minutes : 0);
    }, 0);
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-6 p-2", children: [_jsxs("header", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: [teacher.first_name, " ", teacher.last_name] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Your profile, schedule, load, and assigned students." })] }), _jsx(Link, { href: `/messages?teacherId=${encodeURIComponent(teacherId)}`, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10", children: "Message center" })] }), _jsxs("section", { className: "grid gap-3 md:grid-cols-4", children: [_jsx(Kpi, { label: "Active students", value: activeEnrollments.length }), _jsx(Kpi, { label: "Weekly blocks", value: schedule.length }), _jsx(Kpi, { label: "Weekly hours", value: (weeklyLoadMinutes / 60).toFixed(1) }), _jsx(Kpi, { label: "Status", value: (_a = teacher.status) !== null && _a !== void 0 ? _a : "—" })] }), _jsxs("section", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs(Card, { title: "Profile", children: [_jsx(Row, { label: "Email", value: (_b = teacher.email) !== null && _b !== void 0 ? _b : null }), _jsx(Row, { label: "Phone", value: (_c = teacher.phone) !== null && _c !== void 0 ? _c : null }), _jsx(Row, { label: "Instruments", value: ((_d = teacher.instruments) !== null && _d !== void 0 ? _d : []).join(", ") || null }), _jsx(Row, { label: "Hire date", value: (_e = teacher.hire_date) !== null && _e !== void 0 ? _e : null })] }), _jsx(Card, { title: "Availability", children: _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Availability is managed from the scheduling module. Contact your administrator to update your recurring availability." }) })] }), scheduleHeadline ? (_jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: ["Next recurring block: ", scheduleHeadline] })) : null, _jsx(Card, { title: "Schedule", children: schedule.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No scheduled lessons this week." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)] text-sm", children: schedule.map((b) => {
                        var _a, _b, _c, _d;
                        return (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { children: (_a = b.dayOfWeek) !== null && _a !== void 0 ? _a : "—" }), _jsxs("span", { className: "text-[var(--z-muted)]", children: [(_b = b.startsAt) !== null && _b !== void 0 ? _b : "—", " \u2192 ", (_c = b.endsAt) !== null && _c !== void 0 ? _c : "—"] }), _jsx("span", { className: "text-[var(--z-muted)]", children: (_d = b.status) !== null && _d !== void 0 ? _d : "—" })] }, b.blockId));
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
