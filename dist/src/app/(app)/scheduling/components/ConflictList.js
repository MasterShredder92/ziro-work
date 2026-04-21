import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
function kindLabel(kind) {
    if (kind === "teacher_overlap")
        return "Teacher";
    if (kind === "room_overlap")
        return "Room";
    return "Student";
}
function kindTone(kind) {
    if (kind === "teacher_overlap")
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (kind === "room_overlap")
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    return "bg-red-500/15 text-red-300 border-red-500/30";
}
export function ConflictList({ conflicts, limit = 50, }) {
    if (!conflicts || conflicts.length === 0) {
        return (_jsx(EmptyState, { title: "No conflicts detected", description: "All scheduled blocks are conflict-free in this window." }));
    }
    const rows = conflicts.slice(0, limit);
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Conflicts" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [conflicts.length, " total"] })] }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((c) => {
                    var _a, _b;
                    return (_jsxs("li", { className: "px-4 py-3 flex items-start gap-3", children: [_jsx("span", { className: `inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${kindTone(c.kind)}`, children: kindLabel(c.kind) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: c.reason }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: [c.blockDate, " \u00B7 ", (_a = c.startTime) === null || _a === void 0 ? void 0 : _a.slice(0, 5), "\u2013", (_b = c.endTime) === null || _b === void 0 ? void 0 : _b.slice(0, 5)] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)] mt-0.5 truncate", children: ["Blocks: ", c.conflictWithBlockIds.join(" ↔ ")] })] })] }, c.id));
                }) })] }));
}
