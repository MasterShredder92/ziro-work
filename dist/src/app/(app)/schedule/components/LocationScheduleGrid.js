"use client";
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { getHoursForDate } from "@/lib/schedule/locationHoursUtils";
import { projectBlocksForWindow, } from "@/lib/schedule/windowedClient";
// ─── Block type display config ─────────────────────────────────────────────────
const BLOCK_DISPLAY = {
    student_session: { label: "", bg: "rgba(234,179,8,0.9)", border: "#ca8a04", text: "#000" },
    first_day: { label: "First Day", bg: "rgba(59,130,246,0.85)", border: "#2563eb", text: "#fff" },
    last_day: { label: "Last Day", bg: "rgba(239,68,68,0.85)", border: "#dc2626", text: "#fff" },
    call_out: { label: "Call Out", bg: "rgba(249,115,22,0.85)", border: "#ea580c", text: "#fff" },
    makeup_session: { label: "Makeup", bg: "rgba(236,72,153,0.85)", border: "#db2777", text: "#fff" },
    meet_greet: { label: "Meet & Greet", bg: "rgba(20,184,166,0.85)", border: "#0d9488", text: "#fff" },
    sub: { label: "Sub", bg: "rgba(34,197,94,0.85)", border: "#16a34a", text: "#fff" },
    teacher_training: { label: "Training", bg: "rgba(139,92,246,0.85)", border: "#7c3aed", text: "#fff" },
    not_bookable: { label: "Locked", bg: "rgba(107,114,128,0.7)", border: "#6b7280", text: "#fff" },
    open_time: { label: "Open", bg: "rgba(16,185,129,0.2)", border: "rgba(16,185,129,0.4)", text: "rgba(16,185,129,0.9)" },
    virtual: { label: "Virtual", bg: "rgba(14,165,233,0.85)", border: "#0284c7", text: "#fff" },
};
function getBlockDisplay(block) {
    if (block.checked_in) {
        return { label: "Checked In", bg: "rgba(34,197,94,0.3)", border: "rgba(34,197,94,0.6)", text: "#86efac" };
    }
    if (block.is_family_callout || block.block_type === "call_out")
        return BLOCK_DISPLAY.call_out;
    if (block.is_makeup_session || block.block_type === "makeup_session")
        return BLOCK_DISPLAY.makeup_session;
    if (block.is_virtual || block.block_type === "virtual")
        return BLOCK_DISPLAY.virtual;
    if (block.block_type === "first_day")
        return BLOCK_DISPLAY.first_day;
    if (block.block_type === "last_day")
        return BLOCK_DISPLAY.last_day;
    if (block.block_type === "meet_greet")
        return BLOCK_DISPLAY.meet_greet;
    if (block.block_type === "sub")
        return BLOCK_DISPLAY.sub;
    if (block.block_type === "teacher_training")
        return BLOCK_DISPLAY.teacher_training;
    if (block.block_type === "not_bookable")
        return BLOCK_DISPLAY.not_bookable;
    if (block.block_type === "open_time" || !block.student_id)
        return BLOCK_DISPLAY.open_time;
    return BLOCK_DISPLAY.student_session;
}
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
    return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}
function teacherName(teacher) {
    const t = teacher;
    const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
    const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
    return `${first} ${last}`.trim() || "Teacher";
}
function studentName(student) {
    const s = student;
    const first = typeof s.first_name === "string" ? s.first_name.trim() : "";
    const last = typeof s.last_name === "string" ? s.last_name.trim() : "";
    return `${first} ${last}`.trim() || "Student";
}
// ─── Block type options for the edit panel ────────────────────────────────────
const BLOCK_TYPE_OPTIONS = [
    { value: "student_session", label: "Booked Session" },
    { value: "first_day", label: "First Day" },
    { value: "last_day", label: "Last Day" },
    { value: "call_out", label: "Call Out" },
    { value: "makeup_session", label: "Makeup Session" },
    { value: "meet_greet", label: "Meet & Greet" },
    { value: "sub", label: "Sub" },
    { value: "teacher_training", label: "Training" },
    { value: "not_bookable", label: "Locked Time" },
    { value: "open_time", label: "Open Time" },
    { value: "virtual", label: "Virtual Session" },
];
// ─── Component ────────────────────────────────────────────────────────────────
export function LocationScheduleGrid({ locationId, locationName, locationConfig, selectedDate, blocks, teachers, students, families, availability, rooms, locationHours, onBlocksChange, onRubyEvent, }) {
    var _a, _b, _c;
    const [selectedBlockId, setSelectedBlockId] = React.useState(null);
    const [sessionType, setSessionType] = React.useState("student_session");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    // ── Current time indicator ──────────────────────────────────────────────────
    const [nowMinute, setNowMinute] = React.useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });
    const [nowDate, setNowDate] = React.useState(() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    });
    React.useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNowMinute(n.getHours() * 60 + n.getMinutes());
            setNowDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
        };
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, []);
    // ── Auto check-in loop — runs every 60s, only on today's view ───────────────────────────────────────────────────────
    React.useEffect(() => {
        const runAutoCheckin = () => {
            const _d = new Date();
            const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
            if (selectedDate !== today)
                return;
            void fetch('/api/schedule-blocks/auto-checkin', { method: 'POST' })
                .then(async (res) => {
                var _a;
                if (!res.ok)
                    return;
                const data = await res.json();
                if (!data.updated || !((_a = data.blocks) === null || _a === void 0 ? void 0 : _a.length))
                    return;
                // Patch local state for updated blocks
                onBlocksChange(blocks.map((b) => {
                    const match = data.blocks.find((u) => u.id === b.id);
                    if (!match)
                        return b;
                    return Object.assign(Object.assign({}, b), { checked_in: true, checked_in_at: new Date().toISOString(), teacher_tally: match.teacher_tally });
                }));
            })
                .catch(() => null);
        };
        runAutoCheckin();
        const id = setInterval(runAutoCheckin, 60000);
        return () => clearInterval(id);
    }, [selectedDate, blocks, onBlocksChange]);
    // ── Cancel session modal state ───────────────────────────────────────────────────────
    const [cancelTarget, setCancelTarget] = React.useState(null);
    const [cancelReason, setCancelReason] = React.useState("");
    const [cancelScope, setCancelScope] = React.useState("recurring");
    const [cancelSaving, setCancelSaving] = React.useState(false);
    async function confirmCancel() {
        var _a, _b;
        if (!cancelTarget || !cancelReason.trim())
            return;
        setCancelSaving(true);
        try {
            const res = await fetch("/api/schedule-blocks/cancel-session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    block_id: (_a = cancelTarget.source_block_id) !== null && _a !== void 0 ? _a : cancelTarget.id,
                    block_date: (_b = cancelTarget.block_date) !== null && _b !== void 0 ? _b : selectedDate,
                    student_id: cancelTarget.student_id,
                    reason: cancelReason.trim(),
                    scope: cancelScope,
                }),
            });
            if (!res.ok)
                throw new Error("Cancel failed");
            // Optimistically revert the block in local state
            if (cancelScope === "recurring") {
                onBlocksChange(blocks.map((b) => {
                    var _a;
                    const isBase = b.id === ((_a = cancelTarget.source_block_id) !== null && _a !== void 0 ? _a : cancelTarget.id);
                    if (!isBase)
                        return b;
                    return Object.assign(Object.assign({}, b), { student_id: null, block_type: "open_time", status: "available" });
                }));
            }
            const student = cancelTarget.student_id ? studentsById.get(cancelTarget.student_id) : null;
            onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "call_out", message: `${student ? studentName(student) : "Session"} cancelled (${cancelScope}) — ${cancelReason.trim()}` });
            setCancelTarget(null);
            setCancelReason("");
            setCancelScope("recurring");
            setSelectedBlockId(null);
        }
        finally {
            setCancelSaving(false);
        }
    } // ── Booking state (for open_time / unbooked blocks) ──
    const [bookingStudentQuery, setBookingStudentQuery] = React.useState("");
    const [bookingStudentId, setBookingStudentId] = React.useState(null);
    const [bookingRecurring, setBookingRecurring] = React.useState(true);
    // null = not yet determined; true/false = user answered
    const [bookingFirstDay, setBookingFirstDay] = React.useState(null);
    // null = not yet checked; true = existing student; false = new student
    const [bookingStudentHasBlocks, setBookingStudentHasBlocks] = React.useState(null);
    // ── Compute time bounds from location_hours ──
    const { openMinute, closeMinute, isClosed } = React.useMemo(() => getHoursForDate(locationHours, selectedDate), [locationHours, selectedDate]);
    const slots = React.useMemo(() => {
        if (isClosed)
            return [];
        const out = [];
        for (let m = openMinute; m <= closeMinute; m += 30)
            out.push(m);
        return out;
    }, [openMinute, closeMinute, isClosed]);
    // ── Project blocks for selected date ──
    const projected = React.useMemo(() => projectBlocksForWindow(blocks, selectedDate, selectedDate), [blocks, selectedDate]);
    const dayBlocks = React.useMemo(() => projected.filter((b) => b.block_date === selectedDate), [projected, selectedDate]);
    const dayTeacherIds = React.useMemo(() => Array.from(new Set(dayBlocks.map((b) => b.teacher_id).filter(Boolean))), [dayBlocks]);
    const teachersForBoard = React.useMemo(() => {
        const withBlocks = teachers
            .filter((t) => dayTeacherIds.includes(t.id))
            .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
        return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 12);
    }, [teachers, dayTeacherIds]);
    const teacherBlocks = React.useMemo(() => {
        var _a;
        const map = new Map();
        for (const t of teachersForBoard)
            map.set(t.id, []);
        for (const b of dayBlocks) {
            if (!b.teacher_id)
                continue;
            const list = (_a = map.get(b.teacher_id)) !== null && _a !== void 0 ? _a : [];
            list.push(b);
            map.set(b.teacher_id, list);
        }
        for (const list of map.values()) {
            list.sort((a, b) => a.start_time.localeCompare(b.start_time));
        }
        return map;
    }, [dayBlocks, teachersForBoard]);
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
    const roomsById = React.useMemo(() => {
        const m = new Map();
        for (const r of rooms)
            m.set(r.id, r);
        return m;
    }, [rooms]);
    const selectedBlock = React.useMemo(() => { var _a; return (_a = dayBlocks.find((b) => b.id === selectedBlockId || b.source_block_id === selectedBlockId)) !== null && _a !== void 0 ? _a : null; }, [dayBlocks, selectedBlockId]);
    React.useEffect(() => {
        var _a;
        if (selectedBlock) {
            setSessionType((_a = selectedBlock.block_type) !== null && _a !== void 0 ? _a : "student_session");
            // Reset booking state whenever a new block is selected
            setBookingStudentQuery("");
            setBookingStudentId(null);
            setBookingRecurring(true);
            setBookingFirstDay(null);
            setBookingStudentHasBlocks(null);
            setError(null);
        }
    }, [selectedBlock === null || selectedBlock === void 0 ? void 0 : selectedBlock.id]); // eslint-disable-line react-hooks/exhaustive-deps
    // ── Patch block ──
    async function patchBlock(block, patch, closeOnSuccess = false) {
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
            // Close modal immediately after successful save if requested
            if (closeOnSuccess)
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
        const targetId = block.source_block_id || block.id;
        if (block.student_id && block.teacher_id) {
            await fetch("/api/session-log", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    schedule_block_id: targetId,
                    student_id: block.student_id,
                    teacher_id: block.teacher_id,
                    location_id: block.location_id,
                    block_date: block.block_date,
                    student_rate: 0,
                    teacher_rate: 0,
                    status: "checked_in",
                }),
            }).catch(() => null);
        }
        await patchBlock(block, {
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            teacher_tally: true,
            status: "booked",
        });
        const ciStudent = block.student_id ? studentsById.get(block.student_id) : null;
        onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "check_in", message: `✓ ${ciStudent ? studentName(ciStudent) : "Student"} checked in — logged.` });
    }
    async function callOut(block) {
        await patchBlock(block, {
            block_type: "call_out",
            is_family_callout: true,
            status: "available",
        });
        const coStudent = block.student_id ? studentsById.get(block.student_id) : null;
        onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "call_out", message: `${coStudent ? studentName(coStudent) : "Session"} marked as call-out — still charged.` });
    }
    // ── Check if a student has any existing blocks (to determine new vs existing) ──
    async function checkStudentHasBlocks(studentId) {
        var _a;
        try {
            const res = await fetch(`/api/schedule-blocks?student_id=${encodeURIComponent(studentId)}&limit=1`, { headers: { "content-type": "application/json" } });
            if (!res.ok)
                return false;
            const j = await res.json().catch(() => null);
            const data = (_a = j === null || j === void 0 ? void 0 : j.data) !== null && _a !== void 0 ? _a : j;
            return Array.isArray(data) ? data.length > 0 : false;
        }
        catch (_b) {
            return false;
        }
    }
    // ── Book a student into an open slot ──
    async function bookStudent(block) {
        var _a;
        if (!bookingStudentId)
            return;
        setSaving(true);
        setError(null);
        try {
            const tenantId = (_a = block.tenant_id) !== null && _a !== void 0 ? _a : "";
            const isFirstDay = bookingFirstDay === true;
            const blockType = isFirstDay ? "first_day" : "student_session";
            await fetch(`/api/schedule-blocks/${encodeURIComponent(block.source_block_id || block.id)}?skip_conflict_check=true`, {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                body: JSON.stringify({
                    student_id: bookingStudentId,
                    block_type: blockType,
                    status: "booked",
                    is_recurring: bookingRecurring,
                }),
            });
            // If first_day: stub trigger for invoice creation + studio agreement
            if (isFirstDay) {
                await fetch("/api/events", {
                    method: "POST",
                    headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                    body: JSON.stringify({
                        event_type: "first_day_trigger",
                        student_id: bookingStudentId,
                        block_id: block.source_block_id || block.id,
                        block_date: block.block_date,
                        location_id: locationId,
                        note: "First lesson booked — invoice + studio agreement dispatch pending integration setup",
                    }),
                }).catch(() => null); // stub — endpoint may not exist yet, fail silently
            }
            const updated = blocks.map((b) => b.id === (block.source_block_id || block.id)
                ? Object.assign(Object.assign({}, b), { student_id: bookingStudentId, block_type: blockType, status: "booked", is_recurring: bookingRecurring }) : b);
            onBlocksChange(updated);
            setSelectedBlockId(null);
            const bookedStudent = students.find((s) => s.id === bookingStudentId);
            const bookedName = bookedStudent ? studentName(bookedStudent) : "Student";
            onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({
                type: "book_student",
                message: isFirstDay
                    ? `${bookedName} booked as First Day — invoice + agreement queued.`
                    : `${bookedName} booked as a recurring session.`,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to book student";
            setError(msg);
            onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "error", message: `Booking failed: ${msg}` });
        }
        finally {
            setSaving(false);
        }
    }
    // ── Block position in grid ──
    function blockTop(startTime) {
        const m = toMinute(startTime);
        return ((m - openMinute) / 30) * 48;
    }
    function blockHeight(startTime, endTime) {
        const duration = toMinute(endTime) - toMinute(startTime);
        return Math.max((duration / 30) * 48, 44);
    }
    const gridHeight = slots.length * 48;
    if (isClosed) {
        return (_jsx("div", { className: "mx-4 my-6 rounded-xl border p-8 text-center", style: { borderColor: (_a = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _a !== void 0 ? _a : "var(--z-border)", backgroundColor: (_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.bg) !== null && _b !== void 0 ? _b : "transparent" }, children: _jsxs("p", { className: "text-sm font-semibold", style: { color: (_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _c !== void 0 ? _c : "var(--z-muted)" }, children: [locationName, " is closed on this day"] }) }));
    }
    return (_jsxs("div", { className: "relative h-full min-h-0", children: [_jsxs("div", { className: "flex h-full min-h-0 overflow-auto", children: [_jsxs("div", { className: "sticky left-0 z-10 w-14 shrink-0 bg-[var(--z-bg)]", children: [_jsx("div", { className: "h-[var(--teacher-header-h,52px)]" }), _jsx("div", { style: { height: gridHeight }, className: "relative", children: slots.map((minute, i) => (_jsx("div", { className: "absolute right-2 text-[10px] text-[var(--z-muted)] leading-none", style: { top: i * 48 + 2 }, children: minuteToLabel(minute) }, minute))) })] }), _jsx("div", { className: "flex flex-1 gap-0 overflow-x-auto", children: teachersForBoard.map((teacher) => {
                            var _a, _b, _c, _e;
                            const tBlocks = (_a = teacherBlocks.get(teacher.id)) !== null && _a !== void 0 ? _a : [];
                            const openCount = tBlocks.filter((b) => b.block_type === "open_time" || !b.student_id).length;
                            const bookedCount = tBlocks.filter((b) => b.student_id && b.block_type !== "open_time").length;
                            return (_jsxs("div", { className: "relative min-w-[140px] flex-1 border-l border-[var(--z-border)]", children: [_jsxs("div", { className: "sticky top-0 z-10 border-b px-2 py-2 text-center", style: {
                                            borderColor: (_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _b !== void 0 ? _b : "var(--z-border)",
                                            backgroundColor: (_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.bg) !== null && _c !== void 0 ? _c : "var(--z-bg)",
                                        }, children: [_jsx("div", { className: "truncate text-xs font-semibold", style: { color: (_e = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _e !== void 0 ? _e : "var(--z-fg)" }, children: teacherName(teacher) }), _jsxs("div", { className: "mt-0.5 flex items-center justify-center gap-2 text-[10px] text-[var(--z-muted)]", children: [_jsxs("span", { children: [bookedCount, " booked"] }), openCount > 0 && (_jsxs("span", { className: "text-emerald-400", children: [openCount, " open"] }))] })] }), _jsxs("div", { className: "relative", style: { height: gridHeight }, children: [slots.map((minute, i) => (_jsx("div", { className: "absolute inset-x-0 border-b border-[var(--z-border)]/30", style: { top: i * 48, height: 48 } }, minute))), selectedDate === nowDate && nowMinute >= openMinute && nowMinute <= closeMinute ? (_jsx("div", { className: "pointer-events-none absolute left-0 right-0 z-30", style: { top: ((nowMinute - openMinute) / 30) * 48 }, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" }), _jsx("div", { className: "h-px flex-1 bg-red-500 opacity-80" })] }) })) : null, tBlocks.map((block) => {
                                                const display = getBlockDisplay(block);
                                                const top = blockTop(block.start_time);
                                                const height = blockHeight(block.start_time, block.end_time);
                                                const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
                                                const student = block.student_id ? studentsById.get(block.student_id) : null;
                                                return (_jsxs("button", { type: "button", onClick: () => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id)), className: "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[10px] transition-all hover:z-20 hover:shadow-lg", style: {
                                                        top,
                                                        height,
                                                        backgroundColor: display.bg,
                                                        borderColor: isSelected ? "#fff" : display.border,
                                                        color: display.text,
                                                        outline: isSelected ? `2px solid ${display.border}` : "none",
                                                        outlineOffset: "1px",
                                                        zIndex: isSelected ? 15 : 5,
                                                    }, children: [student ? (_jsx("div", { className: "font-bold leading-tight truncate text-[11px]", children: (() => {
                                                                const instr = student.instrument;
                                                                const emoji = typeof instr === "string" && instr ? (/guitar|bass/i.test(instr) ? "🎸" :
                                                                    /piano|keyboard/i.test(instr) ? "🎹" :
                                                                        /drum|perc/i.test(instr) ? "🥁" :
                                                                            /violin|viola|cello|string/i.test(instr) ? "🎻" :
                                                                                /trumpet|horn|brass/i.test(instr) ? "🎺" :
                                                                                    /sax|clarinet|flute|wind/i.test(instr) ? "🎷" :
                                                                                        /voice|vocal|sing/i.test(instr) ? "🎤" : "🎵") : null;
                                                                return _jsxs(_Fragment, { children: [emoji && _jsx("span", { className: "mr-0.5", children: emoji }), studentName(student)] });
                                                            })() })) : display.label ? (_jsx("div", { className: "font-semibold leading-tight truncate", children: display.label })) : null, _jsxs("div", { className: "opacity-75 leading-tight", children: [minuteToLabel(toMinute(block.start_time)), "\u2013", minuteToLabel(toMinute(block.end_time))] }), block.checked_in && (_jsx("div", { className: "text-[9px] font-bold", children: "\u2713 IN" }))] }, block.id));
                                            })] })] }, teacher.id));
                        }) })] }), selectedBlock && (() => {
                var _a, _b, _c, _e, _f;
                const student = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null;
                const family = (student === null || student === void 0 ? void 0 : student.family_id) ? familiesById.get(student.family_id) : null;
                const display = getBlockDisplay(selectedBlock);
                return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", onClick: () => setSelectedBlockId(null), "aria-hidden": true }), _jsxs("div", { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl", style: {
                                borderColor: (_a = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _a !== void 0 ? _a : "var(--z-border)",
                                backgroundColor: "#0f0f12",
                            }, role: "dialog", "aria-modal": "true", "aria-label": "Block details", children: [_jsxs("div", { className: "flex items-start justify-between rounded-t-2xl border-b px-5 py-4", style: { borderColor: (_b = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.border) !== null && _b !== void 0 ? _b : "var(--z-border)" }, children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider mb-0.5", style: { color: (_c = locationConfig === null || locationConfig === void 0 ? void 0 : locationConfig.textColor) !== null && _c !== void 0 ? _c : "var(--z-muted)" }, children: locationName }), _jsx("h3", { className: "text-base font-bold text-[var(--z-fg)]", children: student ? studentName(student) : (display.label || "Block") }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: [minuteToLabel(toMinute(selectedBlock.start_time)), " \u2013 ", minuteToLabel(toMinute(selectedBlock.end_time))] })] }), _jsx("button", { type: "button", onClick: () => setSelectedBlockId(null), className: "rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors", "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsxs("div", { className: "px-5 py-4 space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), (!selectedBlock.student_id && (selectedBlock.block_type === "open_time" || !selectedBlock.block_type)) ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Book a Student" }), _jsx("input", { type: "text", value: bookingStudentQuery, onChange: (e) => {
                                                                setBookingStudentQuery(e.target.value);
                                                                setBookingStudentId(null);
                                                                setBookingStudentHasBlocks(null);
                                                                setBookingFirstDay(null);
                                                            }, placeholder: "Type student name\u2026", className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)]", autoFocus: true }), bookingStudentQuery.length >= 1 && !bookingStudentId && (() => {
                                                            const q = bookingStudentQuery.toLowerCase();
                                                            const matches = students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 8);
                                                            if (matches.length === 0)
                                                                return _jsx("div", { className: "text-xs text-[var(--z-muted)] px-1", children: "No students found" });
                                                            return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[#0f0f12] shadow-xl overflow-hidden", children: matches.map((s) => {
                                                                    var _a;
                                                                    return (_jsxs("button", { type: "button", className: "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors", onClick: async () => {
                                                                            setBookingStudentId(s.id);
                                                                            setBookingStudentQuery(studentName(s));
                                                                            const hasBlocks = await checkStudentHasBlocks(s.id);
                                                                            setBookingStudentHasBlocks(hasBlocks);
                                                                            // Existing student moving times: skip first-day question
                                                                            if (hasBlocks)
                                                                                setBookingFirstDay(false);
                                                                            else
                                                                                setBookingFirstDay(null); // new student: ask
                                                                        }, children: [_jsx("div", { className: "h-7 w-7 shrink-0 rounded-full bg-[var(--z-surface-2)] flex items-center justify-center text-xs font-bold text-[var(--z-fg)]", children: studentName(s).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: studentName(s) }), _jsx("div", { className: "text-[10px] text-[var(--z-muted)]", children: String((_a = s.instrument) !== null && _a !== void 0 ? _a : "") || "No instrument" })] })] }, s.id));
                                                                }) }));
                                                        })()] }), bookingStudentId && bookingStudentHasBlocks === false && bookingFirstDay === null && (_jsxs("div", { className: "rounded-xl border border-blue-400/40 bg-blue-500/10 p-4 space-y-3", children: [_jsx("p", { className: "text-sm font-semibold text-blue-200", children: "Is this their first lesson?" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "This student has no existing sessions. If it's their first lesson, we'll book it as a First Day and queue their invoice + studio agreement once integrations are set up." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setBookingFirstDay(true), className: "flex-1 rounded-xl border border-blue-400/50 bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30 transition-colors", children: "Yes \u2014 First Lesson" }), _jsx("button", { type: "button", onClick: () => setBookingFirstDay(false), className: "flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5 transition-colors", children: "No \u2014 Regular Session" })] })] })), bookingStudentId && bookingStudentHasBlocks === true && (_jsx("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-xs text-[var(--z-muted)]", children: "Existing student \u2014 booking as a recurring session (no first-day trigger)." })), bookingStudentId && bookingFirstDay !== null && (_jsxs("label", { className: "flex items-center gap-3 cursor-pointer select-none", children: [_jsx("div", { className: `relative h-5 w-9 rounded-full transition-colors ${bookingRecurring ? "bg-[#00ff88]/70" : "bg-[var(--z-surface-2)] border border-[var(--z-border)]"}`, onClick: () => setBookingRecurring((v) => !v), children: _jsx("div", { className: `absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${bookingRecurring ? "translate-x-4" : "translate-x-0.5"}` }) }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: bookingRecurring ? "Recurring every week" : "One-time only" })] })), bookingStudentId && bookingFirstDay !== null && (_jsx("button", { type: "button", disabled: saving, onClick: () => bookStudent(selectedBlock), className: "w-full rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25 transition-colors", children: saving ? "Booking…" : bookingFirstDay ? "Book as First Lesson" : "Book Session" }))] })) : (_jsxs(_Fragment, { children: [student && (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 text-xs space-y-1", children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)] text-sm", children: studentName(student) }), family && (_jsx("div", { className: "text-[var(--z-muted)]", children: (_f = (_e = family.name) !== null && _e !== void 0 ? _e : family.primary_contact_name) !== null && _f !== void 0 ? _f : "" })), (family === null || family === void 0 ? void 0 : family.primary_phone) && (_jsx("div", { className: "text-[var(--z-muted)]", children: family.primary_phone })), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx(Link, { href: `/students/${selectedBlock.student_id}`, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5", onClick: () => setSelectedBlockId(null), children: "Student \u2192" }), student.family_id && (_jsx(Link, { href: `/crm?family=${student.family_id}`, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5", onClick: () => setSelectedBlockId(null), children: "Family \u2192" }))] })] })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Session Type" }), _jsx("select", { value: sessionType, onChange: (e) => setSessionType(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", children: BLOCK_TYPE_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 pt-1", children: [selectedBlock.student_id && (_jsx("button", { type: "button", disabled: saving, onClick: () => checkIn(selectedBlock), className: "col-span-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-3 py-2.5 text-sm font-semibold text-emerald-100 disabled:opacity-50 hover:bg-emerald-500/30 transition-colors", children: saving ? "Saving..." : "✓ Check In" })), _jsx("button", { type: "button", disabled: saving, onClick: () => {
                                                                // Build patch: clear flag overrides so color re-derives from block_type
                                                                const patch = {
                                                                    block_type: sessionType,
                                                                    status: ["open_time", "sub", "call_out"].includes(sessionType) ? "available" : "booked",
                                                                };
                                                                // Clear flags that override block_type in getBlockDisplay
                                                                if (sessionType !== "call_out")
                                                                    patch.is_family_callout = false;
                                                                if (sessionType !== "makeup_session")
                                                                    patch.is_makeup_session = false;
                                                                if (sessionType !== "virtual")
                                                                    patch.is_virtual = false;
                                                                patchBlock(selectedBlock, patch, true);
                                                            }, className: "rounded-xl border border-yellow-400/60 bg-yellow-400/20 px-3 py-2.5 text-sm font-semibold text-yellow-200 disabled:opacity-50 hover:bg-yellow-400/30 transition-colors", children: saving ? "Saving…" : "Save" }), _jsx("button", { type: "button", disabled: saving, onClick: () => callOut(selectedBlock), className: "rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-50 hover:bg-red-500/30 transition-colors", children: "Call Out" }), selectedBlock.student_id && (_jsx("button", { type: "button", disabled: saving, onClick: () => { setCancelTarget(selectedBlock); setCancelReason(""); }, className: "col-span-2 rounded-xl border border-orange-400/60 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/25 transition-colors", children: "Cancel Session" }))] })] }))] })] })] }));
            })(), cancelTarget && (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4", onClick: () => setCancelTarget(null), children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-full max-w-sm rounded-2xl border border-orange-400/30 bg-[#0f0f12] p-6 shadow-2xl space-y-4", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-base font-bold text-white", children: "Cancel Session" }), _jsxs("p", { className: "text-xs text-[#909098]", children: [cancelTarget.student_id ? studentName(studentsById.get(cancelTarget.student_id)) : "Session", " \u2014 ", cancelTarget.start_time, " \u2013 ", cancelTarget.end_time] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Cancel scope" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { type: "button", onClick: () => setCancelScope("single"), className: `rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${cancelScope === "single"
                                                    ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                                                    : "border-[#2b2b2f] bg-[#1a1a1e] text-[#909098] hover:text-white"}`, children: "This lesson only" }), _jsx("button", { type: "button", onClick: () => setCancelScope("recurring"), className: `rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${cancelScope === "recurring"
                                                    ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                                                    : "border-[#2b2b2f] bg-[#1a1a1e] text-[#909098] hover:text-white"}`, children: "All recurring" })] }), _jsx("p", { className: "text-[10px] text-[#505055]", children: cancelScope === "single"
                                            ? "Only this one session will be reverted to open time."
                                            : "This session and all future recurring sessions will be reverted to open time." })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: ["Reason ", _jsx("span", { className: "text-orange-400", children: "*" })] }), _jsx("textarea", { autoFocus: true, rows: 3, value: cancelReason, onChange: e => setCancelReason(e.target.value), placeholder: "Enter reason for cancellation\u2026", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-orange-400/50 focus:outline-none resize-none" })] }), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: () => { setCancelTarget(null); setCancelReason(""); setCancelScope("recurring"); }, className: "flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors", children: "Back" }), _jsx("button", { type: "button", disabled: !cancelReason.trim() || cancelSaving, onClick: confirmCancel, className: "flex-1 rounded-xl border border-orange-400/60 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-40 hover:bg-orange-500/30 transition-colors", children: cancelSaving ? "Cancelling…" : "Confirm Cancel" })] })] })] }))] }));
}
