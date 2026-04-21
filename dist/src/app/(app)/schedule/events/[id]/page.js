import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveScheduleContext } from "../../guard";
import { getEvent } from "@/lib/schedule/service";
import { cancelEventAction, deleteEventAction, updateEventAction, } from "../actions";
export const dynamic = "force-dynamic";
const INPUT_CLASS = "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";
function splitDateTime(iso) {
    const d = new Date(iso);
    const pad = (n) => n.toString().padStart(2, "0");
    return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
}
function durationMinutes(start, end) {
    return Math.max(5, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}
export default async function EventDetailPage({ params, }) {
    var _a, _b, _c, _d;
    const ctx = await resolveScheduleContext().catch(() => null);
    if (!ctx) {
        return (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." }));
    }
    const { id } = await params;
    const event = await getEvent(ctx.tenantId, id);
    if (!event)
        notFound();
    const { date, time } = splitDateTime(event.startTime);
    const duration = durationMinutes(event.startTime, event.endTime);
    const updateAction = updateEventAction.bind(null, event.id);
    const cancelAction = cancelEventAction.bind(null, event.id);
    const deleteAction = deleteEventAction.bind(null, event.id);
    return (_jsxs("div", { className: "space-y-6 max-w-3xl", children: [_jsxs("header", { children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Schedule OS \u00B7 Event ", event.id] }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: event.title }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: [new Date(event.startTime).toLocaleString(), " \u2192", " ", new Date(event.endTime).toLocaleTimeString(), " \u00B7 Status:", " ", _jsx("span", { className: "text-[var(--z-fg)] capitalize", children: event.status }), event.recurrenceId ? (_jsxs(_Fragment, { children: [" ", "\u00B7 ", _jsxs("span", { children: ["Series ", event.recurrenceId] })] })) : null] })] }), ctx.canWrite ? (_jsxs("form", { action: updateAction, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [_jsx(Field, { label: "Title", children: _jsx("input", { name: "title", defaultValue: event.title, className: INPUT_CLASS }) }), _jsx(Field, { label: "Status", children: _jsxs("select", { name: "status", defaultValue: event.status, className: INPUT_CLASS, children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "confirmed", children: "Confirmed" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "no_show", children: "No-show" }), _jsx("option", { value: "cancelled", children: "Cancelled" }), _jsx("option", { value: "rescheduled", children: "Rescheduled" })] }) }), _jsx(Field, { label: "Teacher ID", children: _jsx("input", { name: "teacherId", defaultValue: (_a = event.teacherId) !== null && _a !== void 0 ? _a : "", className: INPUT_CLASS }) }), _jsx(Field, { label: "Student ID", children: _jsx("input", { name: "studentId", defaultValue: (_b = event.studentId) !== null && _b !== void 0 ? _b : "", className: INPUT_CLASS }) }), _jsx(Field, { label: "Room ID", children: _jsx("input", { name: "roomId", defaultValue: (_c = event.roomId) !== null && _c !== void 0 ? _c : "", className: INPUT_CLASS }) }), _jsx(Field, { label: "Date", children: _jsx("input", { type: "date", name: "date", defaultValue: date, className: INPUT_CLASS }) }), _jsx(Field, { label: "Start time", children: _jsx("input", { type: "time", name: "startTime", defaultValue: time, className: INPUT_CLASS }) }), _jsx(Field, { label: "Duration (min)", children: _jsx("input", { type: "number", name: "durationMinutes", min: 5, step: 5, defaultValue: duration, className: INPUT_CLASS }) })] }), _jsx(Field, { label: "Notes", children: _jsx("textarea", { name: "notes", defaultValue: (_d = event.notes) !== null && _d !== void 0 ? _d : "", className: `${INPUT_CLASS} min-h-[80px]` }) }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", name: "allowConflict" }), "Allow conflicts"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: _jsx("button", { type: "submit", className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20", children: "Save changes" }) })] })) : (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]", children: "Read-only view." })), ctx.canWrite ? (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Danger zone" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("form", { action: cancelAction, children: _jsx("button", { type: "submit", className: "rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20", children: "Cancel event" }) }), _jsx("form", { action: deleteAction, children: _jsx("button", { type: "submit", className: "rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20", children: "Delete event" }) })] })] })) : null, _jsx("div", { children: _jsx(Link, { href: "/schedule", className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to calendar" }) })] }));
}
function Field({ label, children, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), children] }));
}
