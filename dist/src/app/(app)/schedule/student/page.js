import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { resolveScheduleContext } from "../guard";
import { listEvents } from "@/lib/schedule/service";
import { resolveStudentContext } from "@/app/(app)/student/guard";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
import { getStudentById } from "@data/students";
export const dynamic = "force-dynamic";
export default async function StudentSchedulePage({ searchParams, }) {
    var _a, _b, _c, _d, _e;
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_f) {
        return (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const requestedStudentId = typeof resolved.studentId === "string" ? resolved.studentId.trim() : "";
    const studentId = ctx.session.role === "student"
        ? (_c = (_b = (await resolveStudentContext().catch(() => null))) === null || _b === void 0 ? void 0 : _b.studentId) !== null && _c !== void 0 ? _c : ""
        : requestedStudentId;
    const now = new Date();
    const from = now.toISOString();
    const later = new Date(now);
    later.setDate(later.getDate() + 28);
    const events = studentId
        ? await listEvents(ctx.tenantId, {
            studentId,
            range: { start: from, end: later.toISOString() },
            limit: 200,
        })
        : [];
    const student = studentId
        ? await getStudentById(studentId, ctx.tenantId).catch(() => null)
        : null;
    const studentName = student
        ? `${(_d = student.first_name) !== null && _d !== void 0 ? _d : ""} ${(_e = student.last_name) !== null && _e !== void 0 ? _e : ""}`.trim() || "Student"
        : null;
    return (_jsxs("div", { className: "space-y-6 max-w-3xl", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS \u00B7 Student" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: ctx.session.role === "student"
                            ? "My upcoming lessons"
                            : "Student upcoming lessons" }), studentName ? (_jsx("p", { className: "text-sm text-[var(--z-fg)] mt-0.5", children: studentName })) : null, _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: ctx.session.role === "student"
                            ? "Your next 4 weeks of scheduled lessons."
                            : "Read-only view of a student's upcoming lessons." })] }), ctx.session.role !== "student" ? (_jsxs("form", { method: "GET", className: "flex gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("label", { className: "flex-1 flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Student ID" }), _jsx("input", { name: "studentId", defaultValue: studentId, placeholder: "student uuid", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsx("button", { type: "submit", className: "self-end rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-medium text-[var(--z-fg)] hover:bg-white/5", children: "Load" })] })) : null, _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-0", children: _jsx(PortalScheduleList, { title: "Upcoming lessons", emptyLabel: studentId
                        ? "No upcoming events in the next 4 weeks."
                        : "No student profile is linked yet.", rows: events.map((ev) => {
                        return {
                            id: ev.id,
                            subject: ev.title,
                            blockDate: ev.startTime.slice(0, 10),
                            startTime: ev.startTime.slice(11, 16),
                            endTime: ev.endTime.slice(11, 16),
                            status: ev.status,
                            blockType: ev.kind,
                        };
                    }) }) })] }));
}
