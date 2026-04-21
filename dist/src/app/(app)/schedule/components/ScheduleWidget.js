import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { listEvents } from "@/lib/schedule/service";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";
function startOfDay(d) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
}
function endOfDay(d) {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
}
export async function ScheduleWidget({ tenantId, title = "Today on the schedule", teacherId, studentId, familyId, href = "/schedule", days = 1, limit = 6, }) {
    const now = new Date();
    const rangeEnd = endOfDay(new Date(now.getTime() + (days - 1) * 24 * 60 * 60 * 1000));
    let events = [];
    try {
        events = await listEvents(tenantId, {
            range: {
                start: startOfDay(now).toISOString(),
                end: rangeEnd.toISOString(),
            },
            teacherId,
            studentId,
            familyId,
            limit: limit * 3,
        });
    }
    catch (_a) {
        events = [];
    }
    const display = events.slice(0, limit);
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Schedule" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title })] }), _jsx(Link, { href: href, className: "text-xs hover:underline", style: { color: SCHEDULING_ACCENT_HEX }, children: "View all \u2192" })] }), display.length === 0 ? (_jsx("div", { className: "px-4 py-6 text-sm text-[var(--z-muted)] text-center", children: "Nothing on the books." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: display.map((ev) => (_jsx("li", { className: "px-4 py-3 flex items-center gap-3", children: _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(Link, { href: `/schedule/events/${ev.id}`, className: "text-sm font-medium text-[var(--z-fg)] truncate hover:underline", children: ev.title }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [new Date(ev.startTime).toLocaleString(undefined, {
                                        weekday: "short",
                                        hour: "numeric",
                                        minute: "2-digit",
                                    }), " ", "\u00B7", " ", _jsx("span", { className: "capitalize", children: ev.status })] })] }) }, ev.id))) }))] }));
}
