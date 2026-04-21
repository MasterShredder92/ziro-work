import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { resolveScheduleContext } from "../guard";
import { getTeacherWeeklyAvailability } from "@/lib/schedule/availability";
import { saveTeacherAvailabilityAction } from "./actions";
export const dynamic = "force-dynamic";
const INPUT_CLASS = "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";
const DAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
export default async function TeacherAvailabilityPage({ searchParams, }) {
    var _a;
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_b) {
        return (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const teacherId = typeof resolved.teacherId === "string" ? resolved.teacherId : "";
    const weekly = teacherId
        ? await getTeacherWeeklyAvailability(ctx.tenantId, teacherId)
        : null;
    const slotByDay = new Map();
    if (weekly) {
        for (const s of weekly.slots) {
            slotByDay.set(s.dayOfWeek, { start: s.startTime, end: s.endTime });
        }
    }
    const save = teacherId
        ? saveTeacherAvailabilityAction.bind(null, teacherId)
        : null;
    return (_jsxs("div", { className: "space-y-6 max-w-4xl", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS \u00B7 Teacher availability" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Weekly availability" }), _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: "Set the days & time windows a teacher is generally available to teach." })] }), _jsxs("form", { method: "GET", className: "flex flex-wrap items-end gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("label", { className: "flex flex-col gap-1 flex-1 min-w-[220px]", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Teacher ID" }), _jsx("input", { name: "teacherId", defaultValue: teacherId, placeholder: "teacher uuid", className: INPUT_CLASS })] }), _jsx("button", { type: "submit", className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-medium text-[var(--z-fg)] hover:bg-white/5", children: "Load availability" })] }), teacherId && weekly && save ? (_jsxs("form", { action: save, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Weekly grid" }), _jsx("div", { className: "space-y-2", children: DAY_LABELS.map((label, day) => {
                            var _a, _b;
                            const existing = slotByDay.get(day);
                            return (_jsxs("div", { className: "grid grid-cols-[140px_auto_1fr_1fr] items-center gap-3 border border-[var(--z-border)] rounded-lg px-3 py-2", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)]", children: label }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("input", { type: "checkbox", name: `day_${day}_enabled`, defaultChecked: !!existing }), "Enabled"] }), _jsx("input", { type: "time", name: `day_${day}_start`, defaultValue: (_a = existing === null || existing === void 0 ? void 0 : existing.start) !== null && _a !== void 0 ? _a : "09:00", className: INPUT_CLASS }), _jsx("input", { type: "time", name: `day_${day}_end`, defaultValue: (_b = existing === null || existing === void 0 ? void 0 : existing.end) !== null && _b !== void 0 ? _b : "17:00", className: INPUT_CLASS })] }, day));
                        }) }), ctx.canWrite ? (_jsx("button", { type: "submit", className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20", children: "Save availability" })) : null] })) : (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]", children: "Enter a teacher ID above to manage availability." }))] }));
}
