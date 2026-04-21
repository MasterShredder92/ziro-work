import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";
function labelFor(kind) {
    switch (kind) {
        case "teacher_overlap":
            return "Teacher overlap";
        case "room_overlap":
            return "Room overlap";
        case "student_overlap":
            return "Student overlap";
    }
}
export function EventConflictList({ conflicts, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Conflicts" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Detected overlaps" })] }), _jsx("span", { className: `text-xs font-semibold ${conflicts.length > 0 ? "text-amber-300" : ""}`, style: conflicts.length > 0 ? undefined : { color: SCHEDULING_ACCENT_HEX }, children: conflicts.length })] }), conflicts.length === 0 ? (_jsx("div", { className: "p-4", children: _jsx(EmptyState, { title: "No overlaps detected", description: "This schedule window is conflict-free." }) })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: conflicts.slice(0, 25).map((c) => (_jsxs("li", { className: "px-4 py-3 flex items-start gap-3 z-hover-micro-subtle", children: [_jsx("span", { className: "mt-1 h-2 w-2 rounded-full bg-amber-400" }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-sm font-medium text-[var(--z-fg)]", children: [labelFor(c.kind), " \u00B7 ", c.reason] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [new Date(c.startTime).toLocaleString(), " \u2192", " ", new Date(c.endTime).toLocaleTimeString()] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]/80 mt-0.5 truncate", children: ["Events: ", c.eventIds.join(" · ")] })] })] }, c.id))) }))] }));
}
