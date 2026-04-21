import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { resolveScheduleContext } from "../guard";
import { listEvents } from "@/lib/schedule/service";
import { resolveCurrentFamilyId } from "@/lib/family/queries";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
import { getFamilyById } from "@data/families";
import { listStudents } from "@data/students";
export const dynamic = "force-dynamic";
function groupByStudent(events) {
    var _a, _b;
    const out = new Map();
    for (const ev of events) {
        const key = (_a = ev.studentId) !== null && _a !== void 0 ? _a : "unassigned";
        const arr = (_b = out.get(key)) !== null && _b !== void 0 ? _b : [];
        arr.push(ev);
        out.set(key, arr);
    }
    return out;
}
function studentDisplayName(row) {
    const first = typeof row.first_name === "string" ? row.first_name.trim() : "";
    const last = typeof row.last_name === "string" ? row.last_name.trim() : "";
    return `${first} ${last}`.trim() || "Student";
}
export default async function FamilySchedulePage({ searchParams, }) {
    var _a, _b;
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_c) {
        return (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const requestedFamilyId = typeof resolved.familyId === "string" ? resolved.familyId.trim() : "";
    const familyId = ctx.session.role === "family"
        ? (_b = (await resolveCurrentFamilyId(ctx.session.userId, ctx.tenantId))) !== null && _b !== void 0 ? _b : ""
        : requestedFamilyId;
    const now = new Date();
    const from = now.toISOString();
    const later = new Date(now);
    later.setDate(later.getDate() + 28);
    const events = familyId
        ? await listEvents(ctx.tenantId, {
            familyId,
            range: { start: from, end: later.toISOString() },
            limit: 500,
        })
        : [];
    const family = familyId
        ? await getFamilyById(familyId, ctx.tenantId).catch(() => null)
        : null;
    const familyLabel = (family === null || family === void 0 ? void 0 : family.name) || (family === null || family === void 0 ? void 0 : family.primary_contact_name) || (family === null || family === void 0 ? void 0 : family.parent_name) || null;
    const familyStudents = familyId
        ? await listStudents(ctx.tenantId, { family_id: familyId }, { orderBy: "first_name", ascending: true, limit: 500 }).catch(() => [])
        : [];
    const studentNamesById = new Map(familyStudents.map((student) => [student.id, studentDisplayName(student)]));
    const byStudent = groupByStudent(events);
    return (_jsxs("div", { className: "space-y-6 max-w-3xl", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS \u00B7 Family" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: ctx.session.role === "family"
                            ? "My family schedule"
                            : "Family schedule" }), familyLabel ? (_jsx("p", { className: "text-sm text-[var(--z-fg)] mt-0.5", children: familyLabel })) : null, _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: ctx.session.role === "family"
                            ? "Upcoming lessons for every student in your household."
                            : "Read-only upcoming lessons for every linked student." })] }), ctx.session.role !== "family" ? (_jsxs("form", { method: "GET", className: "flex gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("label", { className: "flex-1 flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Family ID" }), _jsx("input", { name: "familyId", defaultValue: familyId, placeholder: "family uuid", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsx("button", { type: "submit", className: "self-end rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-medium text-[var(--z-fg)] hover:bg-white/5", children: "Load" })] })) : null, byStudent.size === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]", children: familyId
                    ? "No upcoming events for this family in the next 4 weeks."
                    : "No family profile is linked yet." })) : (_jsx("div", { className: "space-y-4", children: Array.from(byStudent.entries()).map(([studentId, list]) => {
                    var _a;
                    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between", children: [_jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: ["Student: ", (_a = studentNamesById.get(studentId)) !== null && _a !== void 0 ? _a : studentId] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [list.length, " event", list.length === 1 ? "" : "s"] })] }), _jsx(PortalScheduleList, { title: "Upcoming", rows: list.map((ev) => {
                                    return {
                                        id: ev.id,
                                        subject: ev.title,
                                        blockDate: ev.startTime.slice(0, 10),
                                        startTime: ev.startTime.slice(11, 16),
                                        endTime: ev.endTime.slice(11, 16),
                                        status: ev.status,
                                        blockType: ev.kind,
                                    };
                                }) })] }, studentId));
                }) }))] }));
}
