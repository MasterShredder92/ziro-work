"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";
export function ScheduleList({ schedules, activeScheduleId, appointmentsTodayBySchedule, onSelect, children, }) {
    return (_jsxs("aside", { className: "w-full border-b border-[var(--z-border)] bg-[var(--z-surface)] md:w-72 md:border-b-0 md:border-r", children: [_jsx("div", { className: "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Schedules" }), _jsxs("div", { className: "space-y-1 px-2 pb-3", children: [schedules.map((schedule) => {
                        var _a;
                        const active = schedule.id === activeScheduleId;
                        return (_jsxs("button", { type: "button", onClick: () => onSelect(schedule.id), className: [
                                "w-full rounded-md border px-3 py-2 text-left transition-colors",
                                active
                                    ? "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
                                    : "border-[var(--z-border)] hover:bg-white/[0.04]",
                            ].join(" "), children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: schedule.name }), _jsx("span", { className: [
                                                "h-2 w-2 rounded-full",
                                                active ? "" : "bg-[var(--z-muted)]/40",
                                            ].join(" "), style: active ? { backgroundColor: schedule.color || SCHEDULING_ACCENT_HEX } : undefined, "aria-hidden": true })] }), _jsxs("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: ["Today: ", (_a = appointmentsTodayBySchedule[schedule.id]) !== null && _a !== void 0 ? _a : 0, " appointments"] })] }, schedule.id));
                    }), schedules.length === 0 ? (_jsx(EmptyState, { className: "px-3 py-4", title: "No schedules found", description: "Create your first schedule to start managing calendar blocks." })) : null] }), children ? _jsx("div", { className: "border-t border-[var(--z-border)] p-2", children: children }) : null] }));
}
