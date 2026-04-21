"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/system/SurfaceStates";
const DAY_OPTIONS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];
function asInputTime(value) {
    return value.slice(0, 5);
}
export function AvailabilityEditor({ open, schedule, onClose, onCreateBlock, onUpdateBlock, onDeleteBlock, }) {
    const [newDay, setNewDay] = useState(1);
    const [newStart, setNewStart] = useState("09:00");
    const [newEnd, setNewEnd] = useState("17:00");
    const [drafts, setDrafts] = useState({});
    const blocks = useMemo(() => { var _a; return (_a = schedule === null || schedule === void 0 ? void 0 : schedule.availabilityBlocks) !== null && _a !== void 0 ? _a : []; }, [schedule === null || schedule === void 0 ? void 0 : schedule.availabilityBlocks]);
    if (!open || !schedule)
        return null;
    const draftFor = (block) => {
        var _a;
        return (_a = drafts[block.id]) !== null && _a !== void 0 ? _a : {
            dayOfWeek: block.dayOfWeek,
            startTime: asInputTime(block.range.start),
            endTime: asInputTime(block.range.end),
        };
    };
    return (_jsxs("div", { className: "fixed inset-0 z-[85] flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close availability editor", className: "flex-1 bg-black/40", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Availability editor" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: schedule.name })] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onClose, children: "Close" })] }), _jsxs("div", { className: "min-h-0 flex-1 space-y-3 overflow-y-auto p-4", children: [_jsxs("div", { className: "space-y-2 rounded border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Add block" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx("select", { value: newDay, onChange: (event) => setNewDay(Number(event.target.value)), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]", children: DAY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("input", { type: "time", value: newStart, onChange: (event) => setNewStart(event.target.value), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" }), _jsx("input", { type: "time", value: newEnd, onChange: (event) => setNewEnd(event.target.value), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => onCreateBlock(schedule.id, {
                                                    dayOfWeek: newDay,
                                                    startTime: newStart,
                                                    endTime: newEnd,
                                                }), children: "Add block" }) })] }), _jsxs("div", { className: "space-y-2", children: [blocks.length === 0 ? (_jsx(EmptyState, { title: "No availability blocks", description: "Add a block to define when this schedule can accept bookings." })) : null, blocks.map((block) => {
                                            const draft = draftFor(block);
                                            return (_jsxs("div", { className: "space-y-2 rounded border border-[var(--z-border)] p-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx("select", { value: draft.dayOfWeek, onChange: (event) => setDrafts((current) => (Object.assign(Object.assign({}, current), { [block.id]: Object.assign(Object.assign({}, draft), { dayOfWeek: Number(event.target.value) }) }))), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]", children: DAY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("input", { type: "time", value: draft.startTime, onChange: (event) => setDrafts((current) => (Object.assign(Object.assign({}, current), { [block.id]: Object.assign(Object.assign({}, draft), { startTime: event.target.value }) }))), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" }), _jsx("input", { type: "time", value: draft.endTime, onChange: (event) => setDrafts((current) => (Object.assign(Object.assign({}, current), { [block.id]: Object.assign(Object.assign({}, draft), { endTime: event.target.value }) }))), className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { type: "button", size: "sm", variant: "ghost", onClick: () => onDeleteBlock(block.id), children: "Delete" }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => onUpdateBlock(block.id, {
                                                                    dayOfWeek: draft.dayOfWeek,
                                                                    startTime: draft.startTime,
                                                                    endTime: draft.endTime,
                                                                }), children: "Save block" })] })] }, block.id));
                                        })] })] })] }) })] }));
}
