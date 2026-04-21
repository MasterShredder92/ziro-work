"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { getHoursForDate } from "@/lib/schedule/locationHoursUtils";
import { projectBlocksForWindow, } from "@/lib/schedule/windowedClient";
// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMinute(value) {
    const [h = "0", m = "0"] = value.split(":");
    return Number(h) * 60 + Number(m);
}
function minuteToLabel(value) {
    const h24 = Math.floor(value / 60);
    const m = value % 60;
    const hour = h24 % 12 || 12;
    const suffix = h24 >= 12 ? "PM" : "AM";
    return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, "0")}${suffix}`;
}
function nowMinute() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}
function teacherInitials(t) {
    var _a, _b, _c, _d, _e, _f;
    const first = (_b = (_a = t.first_name) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    const last = (_d = (_c = t.last_name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    return `${(_e = first[0]) !== null && _e !== void 0 ? _e : ""}${(_f = last[0]) !== null && _f !== void 0 ? _f : ""}`.toUpperCase() || "?";
}
function teacherName(t) {
    var _a, _b, _c, _d;
    const first = (_b = (_a = t.first_name) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    const last = (_d = (_c = t.last_name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    return `${first} ${last}`.trim() || "Teacher";
}
function studentName(s) {
    var _a, _b, _c, _d;
    const first = (_b = (_a = s.first_name) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    const last = (_d = (_c = s.last_name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    return `${first} ${last}`.trim() || "Student";
}
function instrumentEmoji(instr) {
    if (!instr)
        return "";
    if (/guitar|bass/i.test(instr))
        return "🎸";
    if (/piano|keyboard/i.test(instr))
        return "🎹";
    if (/drum|perc/i.test(instr))
        return "🥁";
    if (/violin|viola|cello|string/i.test(instr))
        return "🎻";
    if (/trumpet|horn|brass/i.test(instr))
        return "🎺";
    if (/sax|clarinet|flute|wind/i.test(instr))
        return "🎷";
    if (/voice|vocal|sing/i.test(instr))
        return "🎤";
    return "🎵";
}
// ─── Block color config ───────────────────────────────────────────────────────
function getBlockColor(block) {
    if (block.checked_in)
        return { bg: "rgba(34,197,94,0.25)", border: "rgba(34,197,94,0.55)", text: "#86efac" };
    if (block.is_family_callout || block.block_type === "call_out")
        return { bg: "rgba(249,115,22,0.85)", border: "#ea580c", text: "#fff" };
    if (block.is_makeup_session || block.block_type === "makeup_session")
        return { bg: "rgba(236,72,153,0.85)", border: "#db2777", text: "#fff" };
    if (block.is_virtual || block.block_type === "virtual")
        return { bg: "rgba(14,165,233,0.85)", border: "#0284c7", text: "#fff" };
    if (block.block_type === "first_day")
        return { bg: "rgba(59,130,246,0.85)", border: "#2563eb", text: "#fff" };
    if (block.block_type === "last_day")
        return { bg: "rgba(239,68,68,0.85)", border: "#dc2626", text: "#fff" };
    if (block.block_type === "meet_greet")
        return { bg: "rgba(20,184,166,0.85)", border: "#0d9488", text: "#fff" };
    if (block.block_type === "sub")
        return { bg: "rgba(34,197,94,0.85)", border: "#16a34a", text: "#fff" };
    if (block.block_type === "teacher_training")
        return { bg: "rgba(139,92,246,0.85)", border: "#7c3aed", text: "#fff" };
    if (block.block_type === "not_bookable")
        return { bg: "rgba(107,114,128,0.7)", border: "#6b7280", text: "#fff" };
    if (block.block_type === "open_time" || !block.student_id)
        return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "rgba(16,185,129,0.9)" };
    return { bg: "rgba(234,179,8,0.9)", border: "#ca8a04", text: "#000" };
}
function getBlockLabel(block) {
    if (block.checked_in)
        return "✓ Checked In";
    if (block.is_family_callout || block.block_type === "call_out")
        return "Call Out";
    if (block.is_makeup_session || block.block_type === "makeup_session")
        return "Makeup";
    if (block.is_virtual || block.block_type === "virtual")
        return "Virtual";
    if (block.block_type === "first_day")
        return "First Day";
    if (block.block_type === "last_day")
        return "Last Day";
    if (block.block_type === "meet_greet")
        return "Meet & Greet";
    if (block.block_type === "sub")
        return "Sub";
    if (block.block_type === "teacher_training")
        return "Training";
    if (block.block_type === "not_bookable")
        return "Locked";
    if (block.block_type === "open_time" || !block.student_id)
        return "Open";
    return ""; // student_session: show student name instead
}
// ─── Constants ────────────────────────────────────────────────────────────────
const PX_PER_MINUTE = 2.5; // horizontal pixels per minute
const ROW_HEIGHT = 64; // px per teacher row
const LABEL_COL_W = 56; // px for time labels column
const TEACHER_COL_W = 80; // px for teacher name column
const BLOCK_TYPES = [
    { value: "student_session", label: "Student Session" },
    { value: "open_time", label: "Open Time" },
    { value: "sub", label: "Sub" },
    { value: "virtual", label: "Virtual" },
    { value: "makeup_session", label: "Makeup Session" },
    { value: "call_out", label: "Call Out" },
    { value: "first_day", label: "First Day" },
    { value: "last_day", label: "Last Day" },
    { value: "meet_greet", label: "Meet & Greet" },
    { value: "teacher_training", label: "Teacher Training" },
    { value: "not_bookable", label: "Not Bookable" },
];
// ─── Full Block Edit Sheet ────────────────────────────────────────────────────
function BlockEditSheet({ block, student, family, teachers, students, onSave, onCheckIn, onCallOut, onCancelSession, onClose, saving, error, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const color = getBlockColor(block);
    const label = getBlockLabel(block);
    const instr = student ? student.instrument : undefined;
    const emoji = instr ? instrumentEmoji(instr) : "";
    const [blockType, setBlockType] = React.useState((_a = block.block_type) !== null && _a !== void 0 ? _a : "student_session");
    const [studentId, setStudentId] = React.useState((_b = block.student_id) !== null && _b !== void 0 ? _b : "");
    const [teacherId, setTeacherId] = React.useState((_c = block.teacher_id) !== null && _c !== void 0 ? _c : "");
    const [isVirtual, setIsVirtual] = React.useState((_d = block.is_virtual) !== null && _d !== void 0 ? _d : false);
    const [isRecurring, setIsRecurring] = React.useState((_e = block.is_recurring) !== null && _e !== void 0 ? _e : false);
    const [notes, setNotes] = React.useState((_f = block.notes) !== null && _f !== void 0 ? _f : "");
    const [tab, setTab] = React.useState("actions");
    const [cancelScope, setCancelScope] = React.useState("single");
    const [cancelReason, setCancelReason] = React.useState("");
    function handleSave() {
        const patch = {
            block_type: blockType,
            student_id: studentId || null,
            teacher_id: teacherId,
            is_virtual: isVirtual,
            is_recurring: isRecurring,
            notes: notes || null,
        };
        onSave(patch);
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center", style: { background: "rgba(0,0,0,0.6)" }, onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg rounded-t-2xl border-t animate-in slide-in-from-bottom-4 duration-300", style: { background: "var(--z-surface)", borderColor: "var(--z-border)", maxHeight: "90dvh", display: "flex", flexDirection: "column" }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-[var(--z-border)]" }), _jsxs("div", { className: "flex items-start gap-3 px-5 py-3 shrink-0", children: [_jsx("div", { className: "h-10 w-1.5 shrink-0 rounded-full", style: { background: color.border } }), _jsxs("div", { className: "min-w-0 flex-1", children: [student ? (_jsxs("div", { className: "text-base font-bold text-[var(--z-fg)]", children: [emoji && _jsx("span", { className: "mr-1", children: emoji }), studentName(student)] })) : (_jsx("div", { className: "text-base font-bold text-[var(--z-fg)]", children: label || "Block" })), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [minuteToLabel(toMinute(block.start_time)), " \u2013 ", minuteToLabel(toMinute(block.end_time)), block.is_recurring && _jsx("span", { className: "ml-2 text-[10px] font-semibold text-purple-400", children: "\u21BB Recurring" }), block.is_virtual && _jsx("span", { className: "ml-2 text-[10px] font-semibold text-blue-400", children: "\uD83D\uDCF9 Virtual" })] }), family && (_jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [(_h = (_g = family.primary_contact_name) !== null && _g !== void 0 ? _g : family.name) !== null && _h !== void 0 ? _h : "", family.primary_phone ? ` · ${family.primary_phone}` : ""] }))] }), _jsx("button", { onClick: onClose, className: "shrink-0 text-[var(--z-muted)] hover:text-[var(--z-fg)] text-lg", children: "\u2715" })] }), _jsx("div", { className: "flex border-b border-[var(--z-border)] px-3 shrink-0", children: ["actions", "edit"].map(t => (_jsx("button", { onClick: () => setTab(t), className: `px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === t ? "border-b-2 border-[var(--z-accent)] text-[var(--z-accent)]" : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: t === "actions" ? "Actions" : "Edit Block" }, t))) }), _jsxs("div", { className: "overflow-y-auto flex-1 p-5 pb-8", children: [error && (_jsx("div", { className: "mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), tab === "actions" && (_jsxs("div", { className: "space-y-2", children: [!block.checked_in && block.student_id && (_jsx("button", { onClick: onCheckIn, disabled: saving, className: "flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-100 disabled:opacity-50", children: saving ? _jsx("span", { className: "animate-pulse", children: "Saving\u2026" }) : _jsx(_Fragment, { children: "\u2713 Check In" }) })), block.checked_in && (_jsx("div", { className: "flex items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300", children: "\u2713 Already Checked In" })), !block.checked_in && block.student_id && (_jsx("button", { onClick: onCallOut, disabled: saving, className: "flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/60 bg-red-500/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-50", children: "Mark Call Out" })), block.student_id && (_jsx("button", { onClick: () => setTab("cancel"), disabled: saving, className: "flex w-full items-center justify-center gap-2 rounded-xl border border-orange-400/60 bg-orange-500/10 py-3 text-sm font-semibold text-orange-300 disabled:opacity-50", children: "\u274C Cancel Session" })), _jsx("button", { onClick: () => setTab("edit"), className: "flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] py-3 text-sm font-semibold text-[var(--z-fg)]", children: "\u270F\uFE0F Edit Block Details" }), _jsx("button", { onClick: onClose, className: "flex w-full items-center justify-center rounded-xl border border-[var(--z-border)] py-3 text-sm text-[var(--z-muted)]", children: "Cancel" })] })), tab === "cancel" && (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Removes the student from this slot and marks it as open time." }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Scope" }), _jsx("div", { className: "flex gap-2", children: ["single", "recurring"].map(s => (_jsx("button", { onClick: () => setCancelScope(s), className: "flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors", style: {
                                                    borderColor: cancelScope === s ? "var(--z-accent)" : "var(--z-border)",
                                                    background: cancelScope === s ? "rgba(99,102,241,0.15)" : "var(--z-surface)",
                                                    color: cancelScope === s ? "var(--z-accent)" : "var(--z-muted)",
                                                }, children: s === "single" ? "This session only" : "All recurring" }, s))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Reason (optional)" }), _jsx("textarea", { value: cancelReason, onChange: e => setCancelReason(e.target.value), placeholder: "e.g. Student sick, family vacation\u2026", rows: 2, className: "w-full rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setTab("actions"), className: "flex-1 rounded-xl border border-[var(--z-border)] py-3 text-sm text-[var(--z-muted)]", children: "Back" }), _jsx("button", { onClick: () => onCancelSession(cancelScope, cancelReason), disabled: saving, className: "flex-1 rounded-xl border border-orange-400/60 bg-orange-500/10 py-3 text-sm font-semibold text-orange-300 disabled:opacity-50", children: saving ? "Cancelling…" : "Confirm Cancel" })] })] })), tab === "edit" && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Block Type" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: BLOCK_TYPES.map(bt => (_jsx("button", { onClick: () => setBlockType(bt.value), className: "rounded-full border px-3 py-1 text-xs font-semibold transition-colors", style: {
                                                    borderColor: blockType === bt.value ? "var(--z-accent)" : "var(--z-border)",
                                                    background: blockType === bt.value ? "rgba(99,102,241,0.15)" : "var(--z-surface)",
                                                    color: blockType === bt.value ? "var(--z-accent)" : "var(--z-muted)",
                                                }, children: bt.label }, bt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Student" }), _jsxs("select", { value: studentId, onChange: e => setStudentId(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]", children: [_jsx("option", { value: "", children: "\u2014 No student (open time) \u2014" }), students.map(s => (_jsx("option", { value: s.id, children: studentName(s) }, s.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Teacher" }), _jsxs("select", { value: teacherId, onChange: e => setTeacherId(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]", children: [_jsx("option", { value: "", children: "\u2014 Select teacher \u2014" }), teachers.map(t => (_jsx("option", { value: t.id, children: teacherName(t) }, t.id)))] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { type: "button", onClick: () => setIsVirtual(!isVirtual), className: "flex flex-1 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors", style: {
                                                borderColor: isVirtual ? "#0284c7" : "var(--z-border)",
                                                background: isVirtual ? "rgba(14,165,233,0.12)" : "var(--z-surface)",
                                                color: isVirtual ? "#38bdf8" : "var(--z-muted)",
                                            }, children: ["\uD83D\uDCF9 Virtual", _jsx("div", { className: `h-5 w-9 rounded-full transition-colors ${isVirtual ? "bg-blue-500" : "bg-[var(--z-border)]"}`, children: _jsx("div", { className: `mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isVirtual ? "translate-x-4 ml-0.5" : "translate-x-0.5"}` }) })] }), _jsxs("button", { type: "button", onClick: () => setIsRecurring(!isRecurring), className: "flex flex-1 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors", style: {
                                                borderColor: isRecurring ? "#7c3aed" : "var(--z-border)",
                                                background: isRecurring ? "rgba(139,92,246,0.12)" : "var(--z-surface)",
                                                color: isRecurring ? "#a78bfa" : "var(--z-muted)",
                                            }, children: ["\u21BB Recurring", _jsx("div", { className: `h-5 w-9 rounded-full transition-colors ${isRecurring ? "bg-purple-500" : "bg-[var(--z-border)]"}`, children: _jsx("div", { className: `mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isRecurring ? "translate-x-4 ml-0.5" : "translate-x-0.5"}` }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider", children: "Notes" }), _jsx("textarea", { value: notes, onChange: e => setNotes(e.target.value), rows: 2, placeholder: "Add notes\u2026", className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSave, disabled: saving, className: "flex flex-1 items-center justify-center rounded-xl bg-[var(--z-accent)] py-3 text-sm font-bold text-[var(--z-on-accent)] disabled:opacity-50", children: saving ? "Saving…" : "Save Changes" }), _jsx("button", { onClick: onClose, className: "flex items-center justify-center rounded-xl border border-[var(--z-border)] px-4 py-3 text-sm text-[var(--z-muted)]", children: "Cancel" })] })] }))] })] }) }));
}
// ─── Main component ───────────────────────────────────────────────────────────
export function MobileScheduleView({ locationId, locationConfig, selectedDate, blocks, teachers, students, families, locationHours, onBlocksChange, }) {
    var _a, _b, _c, _d, _e;
    const [selectedBlockId, setSelectedBlockId] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [currentMinute, setCurrentMinute] = React.useState(nowMinute);
    const [selectedTeacherId, setSelectedTeacherId] = React.useState(null);
    const timelineRef = React.useRef(null);
    // ── Update current time every 30s ──
    React.useEffect(() => {
        const id = setInterval(() => setCurrentMinute(nowMinute()), 30000);
        return () => clearInterval(id);
    }, []);
    // ── Scroll to current time on mount ──
    React.useEffect(() => {
        if (!timelineRef.current)
            return;
        const { openMinute } = getHoursForDate(locationHours, selectedDate);
        const scrollX = Math.max(0, (currentMinute - openMinute) * PX_PER_MINUTE - 80);
        timelineRef.current.scrollLeft = scrollX;
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps
    const { openMinute, closeMinute, isClosed } = React.useMemo(() => getHoursForDate(locationHours, selectedDate), [locationHours, selectedDate]);
    const projected = React.useMemo(() => projectBlocksForWindow(blocks, selectedDate, selectedDate), [blocks, selectedDate]);
    const dayBlocks = React.useMemo(() => projected.filter((b) => b.block_date === selectedDate), [projected, selectedDate]);
    const dayTeacherIds = React.useMemo(() => Array.from(new Set(dayBlocks.map((b) => b.teacher_id).filter(Boolean))), [dayBlocks]);
    const teachersForBoard = React.useMemo(() => {
        const withBlocks = teachers
            .filter((t) => dayTeacherIds.includes(t.id))
            .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
        return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 8);
    }, [teachers, dayTeacherIds]);
    // Filter by selected teacher
    const visibleTeachers = React.useMemo(() => selectedTeacherId
        ? teachersForBoard.filter((t) => t.id === selectedTeacherId)
        : teachersForBoard, [teachersForBoard, selectedTeacherId]);
    const studentsById = React.useMemo(() => {
        const m = new Map();
        for (const s of students)
            m.set(s.id, s);
        return m;
    }, [students]);
    const familiesById = React.useMemo(() => {
        const m = new Map();
        for (const f of families)
            m.set(f.id, f);
        return m;
    }, [families]);
    const selectedBlock = React.useMemo(() => { var _a; return (_a = dayBlocks.find((b) => b.id === selectedBlockId || b.source_block_id === selectedBlockId)) !== null && _a !== void 0 ? _a : null; }, [dayBlocks, selectedBlockId]);
    const totalMinutes = closeMinute - openMinute;
    const timelineWidth = totalMinutes * PX_PER_MINUTE;
    // Time markers every 60 min
    const timeMarkers = React.useMemo(() => {
        const out = [];
        for (let m = openMinute; m <= closeMinute; m += 60)
            out.push(m);
        return out;
    }, [openMinute, closeMinute]);
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    const nowX = isToday ? (currentMinute - openMinute) * PX_PER_MINUTE : null;
    // ── Patch block ──
    async function patchBlock(block, patch) {
        const targetId = block.source_block_id || block.id;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/schedule-blocks/${encodeURIComponent(targetId)}?skip_conflict_check=true`, {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id },
                body: JSON.stringify(patch),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error((payload === null || payload === void 0 ? void 0 : payload.error) || `Update failed (${res.status})`);
            }
            const updated = blocks.map((b) => b.id === targetId ? Object.assign(Object.assign({}, b), patch) : b);
            onBlocksChange(updated);
            setSelectedBlockId(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update");
        }
        finally {
            setSaving(false);
        }
    }
    async function checkIn(block) {
        await patchBlock(block, {
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            teacher_tally: true,
            status: "booked",
        });
    }
    async function callOut(block) {
        await patchBlock(block, {
            block_type: "call_out",
            is_family_callout: true,
            status: "available",
        });
    }
    async function cancelSession(block, scope, reason) {
        var _a;
        const targetId = block.source_block_id || block.id;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/schedule-blocks/cancel-session", {
                method: "POST",
                headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id },
                body: JSON.stringify({
                    block_id: targetId,
                    block_date: (_a = block.block_date) !== null && _a !== void 0 ? _a : selectedDate,
                    student_id: block.student_id,
                    scope,
                    reason: reason.trim() || "Cancelled via mobile",
                }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error((payload === null || payload === void 0 ? void 0 : payload.error) || `Cancel failed (${res.status})`);
            }
            // Optimistically update local state
            const openPatch = {
                student_id: null,
                block_type: "open_time",
                status: "available",
                checked_in: false,
                teacher_tally: false,
            };
            const updated = blocks.map((b) => b.id === targetId ? Object.assign(Object.assign({}, b), openPatch) : b);
            onBlocksChange(updated);
            setSelectedBlockId(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel session");
        }
        finally {
            setSaving(false);
        }
    }
    if (isClosed) {
        return (_jsx("div", { className: "mx-4 my-6 rounded-xl border p-8 text-center", style: { borderColor: (_a = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _a !== void 0 ? _a : "var(--z-border)" }, children: _jsx("p", { className: "text-sm font-semibold text-[var(--z-muted)]", children: "Closed on this day" }) }));
    }
    return (_jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none", children: [_jsx("button", { onClick: () => setSelectedTeacherId(null), className: "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors", style: {
                            borderColor: selectedTeacherId === null
                                ? ((_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _b !== void 0 ? _b : "var(--z-accent)")
                                : "var(--z-border)",
                            background: selectedTeacherId === null
                                ? ((_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.accent) !== null && _c !== void 0 ? _c : "rgba(99,102,241,0.12)")
                                : "var(--z-surface)",
                            color: selectedTeacherId === null
                                ? ((_d = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _d !== void 0 ? _d : "var(--z-accent)")
                                : "var(--z-muted)",
                        }, children: "All" }), teachersForBoard.map((t) => {
                        var _a, _b, _c;
                        return (_jsx("button", { onClick: () => setSelectedTeacherId(t.id === selectedTeacherId ? null : t.id), className: "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors", style: {
                                borderColor: selectedTeacherId === t.id
                                    ? ((_a = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _a !== void 0 ? _a : "var(--z-accent)")
                                    : "var(--z-border)",
                                background: selectedTeacherId === t.id
                                    ? ((_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.accent) !== null && _b !== void 0 ? _b : "rgba(99,102,241,0.12)")
                                    : "var(--z-surface)",
                                color: selectedTeacherId === t.id
                                    ? ((_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _c !== void 0 ? _c : "var(--z-accent)")
                                    : "var(--z-muted)",
                            }, children: teacherInitials(t) }, t.id));
                    })] }), _jsxs("div", { className: "flex overflow-hidden", children: [_jsxs("div", { className: "shrink-0 border-r", style: { width: TEACHER_COL_W, borderColor: "var(--z-border)" }, children: [_jsx("div", { className: "border-b", style: { height: 28, borderColor: "var(--z-border)" } }), visibleTeachers.map((t) => {
                                var _a, _b, _c;
                                return (_jsx("div", { className: "flex items-center justify-center border-b px-2", style: { height: ROW_HEIGHT, borderColor: "var(--z-border)" }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold", style: {
                                                    borderColor: (_a = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _a !== void 0 ? _a : "var(--z-border)",
                                                    background: (_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.accent) !== null && _b !== void 0 ? _b : "var(--z-surface-2)",
                                                    color: (_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _c !== void 0 ? _c : "var(--z-accent)",
                                                }, children: teacherInitials(t) }), _jsx("div", { className: "max-w-[68px] truncate text-[9px] text-[var(--z-muted)]", children: teacherName(t).split(" ")[0] })] }) }, t.id));
                            })] }), _jsx("div", { ref: timelineRef, className: "flex-1 overflow-x-auto overflow-y-hidden", style: { WebkitOverflowScrolling: "touch" }, children: _jsxs("div", { style: { width: timelineWidth + LABEL_COL_W, position: "relative" }, children: [_jsx("div", { className: "relative border-b", style: { height: 28, borderColor: "var(--z-border)" }, children: timeMarkers.map((m) => (_jsx("div", { className: "absolute top-1 text-[9px] text-[var(--z-muted)]", style: { left: (m - openMinute) * PX_PER_MINUTE }, children: minuteToLabel(m) }, m))) }), visibleTeachers.map((teacher) => {
                                    const tBlocks = dayBlocks.filter((b) => b.teacher_id === teacher.id);
                                    return (_jsxs("div", { className: "relative border-b", style: { height: ROW_HEIGHT, borderColor: "var(--z-border)" }, children: [timeMarkers.map((m) => (_jsx("div", { className: "absolute top-0 bottom-0 border-l border-[var(--z-border)]/20", style: { left: (m - openMinute) * PX_PER_MINUTE } }, m))), tBlocks.map((block) => {
                                                const startM = toMinute(block.start_time);
                                                const endM = toMinute(block.end_time);
                                                const left = (startM - openMinute) * PX_PER_MINUTE;
                                                const width = Math.max((endM - startM) * PX_PER_MINUTE - 2, 20);
                                                const color = getBlockColor(block);
                                                const label = getBlockLabel(block);
                                                const student = block.student_id ? studentsById.get(block.student_id) : null;
                                                const instr = student ? student.instrument : undefined;
                                                const emoji = instr ? instrumentEmoji(instr) : "";
                                                const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
                                                return (_jsxs("button", { onClick: () => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id)), className: "absolute top-1 bottom-1 overflow-hidden rounded border px-1 py-0.5 text-left transition-all", style: {
                                                        left,
                                                        width,
                                                        backgroundColor: color.bg,
                                                        borderColor: isSelected ? "#fff" : color.border,
                                                        color: color.text,
                                                        outline: isSelected ? `2px solid ${color.border}` : "none",
                                                        zIndex: isSelected ? 10 : 2,
                                                    }, children: [student ? (_jsxs("div", { className: "truncate text-[10px] font-bold leading-tight", children: [emoji && _jsx("span", { className: "mr-0.5", children: emoji }), studentName(student)] })) : label ? (_jsx("div", { className: "truncate text-[10px] font-semibold leading-tight", children: label })) : null, width > 50 && (_jsx("div", { className: "truncate text-[9px] opacity-80 leading-tight", children: minuteToLabel(startM) })), block.checked_in && (_jsx("div", { className: "text-[8px] font-bold", children: "\u2713" }))] }, block.id));
                                            })] }, teacher.id));
                                }), nowX !== null && nowX >= 0 && nowX <= timelineWidth && (_jsxs("div", { className: "pointer-events-none absolute top-0 bottom-0 z-20", style: { left: nowX, width: 2, background: "#a855f7" }, children: [_jsx("div", { className: "absolute -top-1 -left-[3px] h-2 w-2 rounded-full", style: { background: "#a855f7" } }), _jsx("div", { className: "absolute top-0 left-2 rounded px-1 py-0.5 text-[9px] font-bold text-white", style: { background: "#a855f7" }, children: minuteToLabel(currentMinute) })] }))] }) })] }), isToday && (() => {
                const autoCheckInCandidates = dayBlocks.filter((b) => {
                    if (b.checked_in || !b.student_id)
                        return false;
                    const startM = toMinute(b.start_time);
                    const endM = toMinute(b.end_time);
                    // Suggest check-in if within 10 min of start or during the block
                    return currentMinute >= startM - 10 && currentMinute < endM;
                });
                if (autoCheckInCandidates.length === 0)
                    return null;
                return (_jsxs("div", { className: "mx-4 mt-3 rounded-xl border px-4 py-3", style: { borderColor: "rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.08)" }, children: [_jsx("div", { className: "mb-2 flex items-center gap-2", children: _jsxs("span", { className: "text-xs font-bold text-purple-300", children: ["\uD83D\uDFE3 ", autoCheckInCandidates.length, " session", autoCheckInCandidates.length !== 1 ? "s" : "", " ready to check in"] }) }), _jsx("div", { className: "space-y-1.5", children: autoCheckInCandidates.slice(0, 4).map((b) => {
                                const student = b.student_id ? studentsById.get(b.student_id) : null;
                                const teacher = teachers.find((t) => t.id === b.teacher_id);
                                return (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("span", { className: "truncate text-xs font-semibold text-[var(--z-fg)]", children: student ? studentName(student) : "Student" }), teacher && (_jsxs("span", { className: "ml-1 text-[10px] text-[var(--z-muted)]", children: ["w/ ", teacherName(teacher).split(" ")[0]] })), _jsx("span", { className: "ml-1 text-[10px] text-[var(--z-muted)]", children: minuteToLabel(toMinute(b.start_time)) })] }), _jsx("button", { onClick: () => checkIn(b), disabled: saving, className: "shrink-0 rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-100 disabled:opacity-50", children: "\u2713 Check In" })] }, b.id));
                            }) })] }));
            })(), selectedBlock && (_jsx(BlockEditSheet, { block: selectedBlock, student: selectedBlock.student_id ? ((_e = studentsById.get(selectedBlock.student_id)) !== null && _e !== void 0 ? _e : null) : null, family: (() => {
                    var _a;
                    const s = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null;
                    return (s === null || s === void 0 ? void 0 : s.family_id) ? ((_a = familiesById.get(s.family_id)) !== null && _a !== void 0 ? _a : null) : null;
                })(), teachers: teachers, students: students, onSave: (patch) => patchBlock(selectedBlock, patch), onCheckIn: () => checkIn(selectedBlock), onCallOut: () => callOut(selectedBlock), onCancelSession: (scope, reason) => cancelSession(selectedBlock, scope, reason), onClose: () => { setSelectedBlockId(null); setError(null); }, saving: saving, error: error }))] }));
}
