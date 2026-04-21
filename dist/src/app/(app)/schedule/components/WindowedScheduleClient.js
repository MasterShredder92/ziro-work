/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { shiftWindowByWeeks } from "@/lib/schedule/window";
import { computeOpenSlotsForWindow, projectBlocksForWindow, } from "@/lib/schedule/windowedClient";
const BLOCK_TYPE_OPTIONS = [
    { value: "student_session", label: "Private Session" },
    { value: "makeup_session", label: "Makeup Session" },
    { value: "meet_greet", label: "Meet & Greet" },
    { value: "teacher_training", label: "Teacher Training" },
    { value: "open_time", label: "Open Time" },
    { value: "sub", label: "Sub Coverage" },
    { value: "call_out", label: "Call Out" },
    { value: "virtual", label: "Virtual Session" },
    { value: "first_day", label: "First Day" },
    { value: "last_day", label: "Last Day" },
    { value: "not_bookable", label: "Not Bookable" },
];
function keyOf(window) {
    return `${window.start}_${window.end}`;
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function dayName(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
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
function dayOfWeekToIndex(value) {
    switch (value) {
        case "sunday":
            return 0;
        case "monday":
            return 1;
        case "tuesday":
            return 2;
        case "wednesday":
            return 3;
        case "thursday":
            return 4;
        case "friday":
            return 5;
        case "saturday":
            return 6;
        default: {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : -1;
        }
    }
}
function teacherName(teacher) {
    const t = teacher;
    const explicit = typeof t.name === "string" ? t.name.trim() : "";
    if (explicit)
        return explicit;
    const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
    const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
    return `${first} ${last}`.trim() || "Teacher";
}
function safeTeacherName(teacher) {
    if (!teacher)
        return "Unknown teacher";
    return teacherName(teacher);
}
function studentName(student) {
    const s = student;
    const explicit = typeof s.name === "string" ? s.name.trim() : "";
    if (explicit)
        return explicit;
    const first = typeof s.first_name === "string" ? s.first_name.trim() : "";
    const last = typeof s.last_name === "string" ? s.last_name.trim() : "";
    return `${first} ${last}`.trim() || "Student";
}
function blockEmoji(block) {
    if (block.checked_in)
        return "✅";
    if (block.is_virtual || block.block_type === "virtual")
        return "💻";
    if (block.block_type === "call_out" || block.is_family_callout)
        return "📵";
    if (block.block_type === "sub")
        return "🛟";
    if (block.block_type === "makeup_session" || block.is_makeup_session)
        return "🔁";
    if (block.block_type === "meet_greet")
        return "🤝";
    if (block.block_type === "teacher_training")
        return "🎯";
    if (block.block_type === "open_time")
        return "🟢";
    if (block.status === "booked")
        return "🎵";
    return "🕒";
}
function blockCardClass(block) {
    if (block.block_type === "call_out" || block.is_family_callout) {
        return "bg-orange-500/30 border-orange-300/70 text-orange-100";
    }
    if (block.block_type === "sub") {
        return "bg-violet-500/30 border-violet-300/70 text-violet-100";
    }
    if (block.is_makeup_session || block.block_type === "makeup_session") {
        return "bg-cyan-500/30 border-cyan-300/70 text-cyan-100";
    }
    if (block.is_virtual || block.block_type === "virtual") {
        return "bg-sky-500/30 border-sky-300/70 text-sky-100";
    }
    if (!block.student_id || block.block_type === "open_time") {
        return "bg-emerald-500/20 border-emerald-300/60 text-emerald-100";
    }
    if (block.checked_in) {
        return "bg-emerald-400/30 border-emerald-200/80 text-emerald-50";
    }
    return "bg-yellow-300 border-yellow-100 text-black";
}
function familyDisplayName(family) {
    var _a, _b, _c;
    if (!family)
        return "Family";
    const name = (_a = family.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (name)
        return name;
    const primary = (_b = family.primary_contact_name) === null || _b === void 0 ? void 0 : _b.trim();
    if (primary)
        return primary;
    const parent = (_c = family.parent_name) === null || _c === void 0 ? void 0 : _c.trim();
    if (parent)
        return parent;
    return "Family";
}
export function WindowedScheduleClient({ locationId, locationLabel, locations = [], initialWindow, initialBlocks, teachers, students, families, availability, rooms = [], }) {
    var _a, _b, _c, _e, _f;
    const router = useRouter();
    const [window, setWindow] = React.useState(initialWindow);
    const [selectedDate, setSelectedDate] = React.useState(initialWindow.start);
    const [blocksByWindow, setBlocksByWindow] = React.useState({
        [keyOf(initialWindow)]: initialBlocks,
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [selectedBlockId, setSelectedBlockId] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [sessionType, setSessionType] = React.useState("student_session");
    const [roomIdDraft, setRoomIdDraft] = React.useState("");
    const [isVirtualDraft, setIsVirtualDraft] = React.useState(false);
    // Cancel session modal state
    const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState("");
    const [cancelTargetBlock, setCancelTargetBlock] = React.useState(null);
    // Current time indicator — updates every 30 seconds
    const [nowMinute, setNowMinute] = React.useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });
    const [nowDate, setNowDate] = React.useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; });
    const teacherIds = React.useMemo(() => teachers.map((t) => t.id), [teachers]);
    // ── Current time indicator ticker ──────────────────────────────────────────
    React.useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNowMinute(n.getHours() * 60 + n.getMinutes());
            setNowDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
        };
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, []);
    // ── Auto check-in loop — runs every 60s, only on today's view ──────────────
    React.useEffect(() => {
        const runAutoCheckin = () => {
            const _d = new Date();
            const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
            if (selectedDate !== today)
                return;
            void fetch("/api/schedule-blocks/auto-checkin", { method: "POST" })
                .then(async (res) => {
                var _a;
                if (!res.ok)
                    return;
                const data = await res.json();
                if (!data.updated || !((_a = data.blocks) === null || _a === void 0 ? void 0 : _a.length))
                    return;
                // Patch local state for updated blocks
                const key = keyOf(window);
                setBlocksByWindow((prev) => {
                    var _a;
                    const rows = [...((_a = prev[key]) !== null && _a !== void 0 ? _a : [])];
                    for (const updated of data.blocks) {
                        const idx = rows.findIndex((r) => r.id === updated.id);
                        if (idx >= 0) {
                            rows[idx] = Object.assign(Object.assign({}, rows[idx]), { checked_in: true, checked_in_at: new Date().toISOString(), teacher_tally: updated.teacher_tally });
                        }
                    }
                    return Object.assign(Object.assign({}, prev), { [key]: rows });
                });
            })
                .catch(() => null);
        };
        runAutoCheckin();
        const id = setInterval(runAutoCheckin, 60000);
        return () => clearInterval(id);
    }, [selectedDate, window]);
    React.useEffect(() => {
        const key = keyOf(window);
        if (blocksByWindow[key])
            return;
        let cancelled = false;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        void fetch(`/api/schedule/blocks?locationId=${encodeURIComponent(locationId)}&start=${window.start}&end=${window.end}`, { signal: controller.signal })
            .then(async (res) => {
            if (!res.ok)
                throw new Error(`Failed to load blocks (${res.status})`);
            return (await res.json());
        })
            .then((payload) => {
            if (cancelled)
                return;
            setBlocksByWindow((prev) => { var _a; return (Object.assign(Object.assign({}, prev), { [key]: (_a = payload.blocks) !== null && _a !== void 0 ? _a : [] })); });
        })
            .catch((err) => {
            if (cancelled || controller.signal.aborted)
                return;
            setError(err instanceof Error ? err.message : "Failed to load window");
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [window, blocksByWindow, locationId]);
    const currentBlocks = (_a = blocksByWindow[keyOf(window)]) !== null && _a !== void 0 ? _a : [];
    const projected = React.useMemo(() => projectBlocksForWindow(currentBlocks, window.start, window.end), [currentBlocks, window.start, window.end]);
    const openSlots = React.useMemo(() => computeOpenSlotsForWindow({
        teacherIds,
        availability,
        projectedBlocks: projected,
        start: window.start,
        end: window.end,
    }), [teacherIds, availability, projected, window.start, window.end]);
    const moveWeeks = React.useCallback((weeks) => {
        setWindow((prev) => shiftWindowByWeeks(prev.start, weeks * 2));
    }, []);
    const assignedBlockCount = React.useMemo(() => projected.filter((b) => Boolean(b.student_id)).length, [projected]);
    const studentNames = React.useMemo(() => {
        const map = new Map();
        for (const student of students) {
            map.set(student.id, studentName(student));
        }
        return map;
    }, [students]);
    const studentsById = React.useMemo(() => {
        const map = new Map();
        for (const student of students)
            map.set(student.id, student);
        return map;
    }, [students]);
    const familiesById = React.useMemo(() => {
        const map = new Map();
        for (const family of families)
            map.set(family.id, family);
        return map;
    }, [families]);
    const familyByStudentId = React.useMemo(() => {
        const map = new Map();
        for (const student of students) {
            if (!student.family_id)
                continue;
            const family = familiesById.get(student.family_id);
            if (family)
                map.set(student.id, family);
        }
        return map;
    }, [students, familiesById]);
    const dayBlocks = React.useMemo(() => projected.filter((block) => block.block_date === selectedDate), [projected, selectedDate]);
    const dayTeacherIds = React.useMemo(() => Array.from(new Set(dayBlocks.map((block) => block.teacher_id).filter(Boolean))), [dayBlocks]);
    const teachersForBoard = React.useMemo(() => {
        const mapped = teachers
            .filter((teacher) => dayTeacherIds.includes(teacher.id))
            .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
        return mapped.length > 0 ? mapped : teachers.slice(0, 10);
    }, [teachers, dayTeacherIds]);
    const teacherBlocks = React.useMemo(() => {
        var _a;
        const map = new Map();
        for (const teacher of teachersForBoard) {
            map.set(teacher.id, []);
        }
        for (const block of dayBlocks) {
            if (!block.teacher_id)
                continue;
            const list = (_a = map.get(block.teacher_id)) !== null && _a !== void 0 ? _a : [];
            list.push(block);
            map.set(block.teacher_id, list);
        }
        for (const entry of map.values()) {
            entry.sort((a, b) => a.start_time.localeCompare(b.start_time));
        }
        return map;
    }, [dayBlocks, teachersForBoard]);
    const teachersById = React.useMemo(() => {
        const map = new Map();
        for (const teacher of teachers)
            map.set(teacher.id, teacher);
        return map;
    }, [teachers]);
    const roomsById = React.useMemo(() => {
        const map = new Map();
        for (const room of rooms)
            map.set(room.id, room);
        return map;
    }, [rooms]);
    const dayAvail = React.useMemo(() => {
        const day = new Date(`${selectedDate}T00:00:00.000Z`).getUTCDay();
        return availability.filter((row) => dayOfWeekToIndex(String(row.day_of_week)) === day);
    }, [availability, selectedDate]);
    const [startMinute, endMinute] = React.useMemo(() => {
        const defaultStart = 9 * 60;
        const defaultEnd = 21 * 60;
        if (dayAvail.length === 0)
            return [defaultStart, defaultEnd];
        const mins = dayAvail.flatMap((row) => [toMinute(row.start_time), toMinute(row.end_time)]);
        const lo = Math.min(...mins, defaultStart);
        const hi = Math.max(...mins, defaultEnd);
        const boundedLo = Math.max(6 * 60, Math.floor(lo / 30) * 30);
        const boundedHi = Math.min(23 * 60, Math.ceil(hi / 30) * 30);
        return [boundedLo, Math.max(boundedLo + 60, boundedHi)];
    }, [dayAvail]);
    const slots = React.useMemo(() => {
        const out = [];
        for (let minute = startMinute; minute <= endMinute; minute += 30)
            out.push(minute);
        return out;
    }, [startMinute, endMinute]);
    const legend = React.useMemo(() => [
        { label: "🎵 Assigned", className: "bg-yellow-300 border-yellow-100 text-black" },
        { label: "🟢 Open Time", className: "bg-emerald-500/20 border-emerald-300/60 text-emerald-100" },
        { label: "📵 Call Out", className: "bg-orange-500/30 border-orange-300/70 text-orange-100" },
        { label: "🛟 Sub Coverage", className: "bg-violet-500/30 border-violet-300/70 text-violet-100" },
        { label: "💻 Virtual", className: "bg-sky-500/30 border-sky-300/70 text-sky-100" },
        { label: "✅ Checked In", className: "bg-emerald-400/30 border-emerald-200/80 text-emerald-50" },
    ], []);
    const openByTeacher = React.useMemo(() => {
        var _a;
        const map = new Map();
        for (const slot of openSlots) {
            if (slot.date !== selectedDate)
                continue;
            map.set(slot.teacherId, ((_a = map.get(slot.teacherId)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
        return map;
    }, [openSlots, selectedDate]);
    const teacherLoadByDate = React.useMemo(() => {
        var _a;
        const load = new Map();
        for (const block of dayBlocks) {
            if (!block.teacher_id)
                continue;
            const countable = Boolean(block.student_id) || block.block_type === "sub" || block.block_type === "makeup_session";
            if (!countable)
                continue;
            load.set(block.teacher_id, ((_a = load.get(block.teacher_id)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
        return load;
    }, [dayBlocks]);
    const selectedBlock = React.useMemo(() => { var _a; return (_a = dayBlocks.find((block) => block.id === selectedBlockId)) !== null && _a !== void 0 ? _a : null; }, [dayBlocks, selectedBlockId]);
    React.useEffect(() => {
        var _a, _b;
        if (!selectedBlock)
            return;
        setSessionType((_a = selectedBlock.block_type) !== null && _a !== void 0 ? _a : "student_session");
        setRoomIdDraft((_b = selectedBlock.room_id) !== null && _b !== void 0 ? _b : "");
        setIsVirtualDraft(Boolean(selectedBlock.is_virtual));
    }, [selectedBlock === null || selectedBlock === void 0 ? void 0 : selectedBlock.id]);
    async function patchBlock(block, patch, options) {
        const targetId = block.source_block_id || block.id;
        setSaving(true);
        setError(null);
        try {
            if (!(options === null || options === void 0 ? void 0 : options.localOnly)) {
                const response = await fetch(`/api/schedule-blocks/${encodeURIComponent(targetId)}?skip_conflict_check=true`, {
                    method: "PATCH",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": block.tenant_id,
                    },
                    body: JSON.stringify(patch),
                });
                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    throw new Error((payload === null || payload === void 0 ? void 0 : payload.error) || `Update failed (${response.status})`);
                }
            }
            const key = keyOf(window);
            setBlocksByWindow((prev) => {
                var _a;
                const rows = [...((_a = prev[key]) !== null && _a !== void 0 ? _a : [])];
                const idx = rows.findIndex((row) => row.id === targetId);
                if (idx >= 0) {
                    rows[idx] = Object.assign(Object.assign({}, rows[idx]), patch);
                }
                return Object.assign(Object.assign({}, prev), { [key]: rows });
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update block");
        }
        finally {
            setSaving(false);
        }
    }
    async function checkInBlock(block) {
        const canLog = typeof block.student_id === "string" &&
            block.student_id.trim().length > 0 &&
            typeof block.teacher_id === "string" &&
            block.teacher_id.trim().length > 0;
        if (canLog) {
            const targetId = block.source_block_id || block.id;
            await fetch("/api/session-log", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
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
    }
    async function createSubCoverage(block) {
        var _a;
        function selectCoverageTeacherId() {
            var _a;
            const day = new Date(`${block.block_date}T00:00:00.000Z`).getUTCDay();
            const blockStart = toMinute(block.start_time);
            const blockEnd = toMinute(block.end_time);
            function hasOverlap(teacherId) {
                return dayBlocks.some((existing) => {
                    if (existing.teacher_id !== teacherId)
                        return false;
                    if (existing.id === block.id || existing.id === block.source_block_id)
                        return false;
                    if (existing.block_type === "open_time" || existing.block_type === "call_out")
                        return false;
                    const start = toMinute(existing.start_time);
                    const end = toMinute(existing.end_time);
                    return start < blockEnd && end > blockStart;
                });
            }
            const candidateIds = teachers
                .filter((teacher) => teacher.id !== block.teacher_id)
                .filter((teacher) => availability.some((row) => row.teacher_id === teacher.id &&
                dayOfWeekToIndex(String(row.day_of_week)) === day &&
                toMinute(row.start_time) <= blockStart &&
                toMinute(row.end_time) >= blockEnd))
                .map((teacher) => teacher.id)
                .filter((teacherId) => !hasOverlap(teacherId));
            const sorted = candidateIds.sort((a, b) => {
                var _a, _b;
                const loadA = (_a = teacherLoadByDate.get(a)) !== null && _a !== void 0 ? _a : 0;
                const loadB = (_b = teacherLoadByDate.get(b)) !== null && _b !== void 0 ? _b : 0;
                if (loadA !== loadB)
                    return loadA - loadB;
                return safeTeacherName(teachersById.get(a)).localeCompare(safeTeacherName(teachersById.get(b)));
            });
            return (_a = sorted[0]) !== null && _a !== void 0 ? _a : block.teacher_id;
        }
        const coverageTeacherId = selectCoverageTeacherId();
        const coverageTeacherName = safeTeacherName(teachersById.get(coverageTeacherId));
        setSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/schedule-blocks?skip_conflict_check=true", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": block.tenant_id,
                },
                body: JSON.stringify({
                    block_date: block.block_date,
                    start_time: block.start_time,
                    end_time: block.end_time,
                    teacher_id: coverageTeacherId,
                    location_id: block.location_id,
                    student_id: block.student_id,
                    room_id: block.room_id,
                    block_type: "sub",
                    status: block.student_id ? "booked" : "available",
                    is_recurring: false,
                    is_virtual: false,
                    original_teacher_id: block.teacher_id,
                    original_teacher_name: safeTeacherName(teachersById.get((_a = block.teacher_id) !== null && _a !== void 0 ? _a : "")),
                    notes: `Auto-created sub coverage block (${coverageTeacherName})`,
                }),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error((payload === null || payload === void 0 ? void 0 : payload.error) || `Failed to create sub (${response.status})`);
            }
            const payload = await response.json().catch(() => null);
            const created = payload === null || payload === void 0 ? void 0 : payload.data;
            if (created) {
                const key = keyOf(window);
                setBlocksByWindow((prev) => { var _a; return (Object.assign(Object.assign({}, prev), { [key]: [created, ...((_a = prev[key]) !== null && _a !== void 0 ? _a : [])] })); });
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create sub coverage");
        }
        finally {
            setSaving(false);
        }
    }
    async function callOutBlock(block) {
        await patchBlock(block, {
            status: "available",
            block_type: "call_out",
            is_family_callout: false,
            callout_reason: "Teacher call out",
            checked_in: false,
            teacher_tally: false,
        });
        await createSubCoverage(block);
    }
    async function cancelSessionWithReason(block, reason) {
        var _a;
        // 1. Mark block as cancelled call-out with the provided reason
        await patchBlock(block, {
            status: "available",
            block_type: "call_out",
            is_family_callout: true,
            callout_reason: reason,
            checked_in: false,
            teacher_tally: false,
        });
        // 2. Write activity log entry under the student
        if (block.student_id && block.tenant_id) {
            const studentLabel = (_a = studentNames.get(block.student_id)) !== null && _a !== void 0 ? _a : "Student";
            void fetch("/api/activity-log", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    entity_type: "student",
                    entity_id: block.student_id,
                    entity_name: studentLabel,
                    action: "session_cancelled",
                    details: `Session on ${block.block_date} ${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)} cancelled. Reason: ${reason}`,
                    location_id: block.location_id,
                }),
            }).catch(() => null);
        }
    }
    async function virtualizeBlock(block) {
        await patchBlock(block, {
            is_virtual: true,
            block_type: "virtual",
            converted_to_virtual_at: new Date().toISOString(),
        });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS" }), _jsxs("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: [locationLabel, " \u00B7 ", window.start, " to ", window.end] }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Board view with 30-minute blocks, teachers, open slots, call-outs, and quick actions." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => moveWeeks(-1), className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm", children: "Prev 2 weeks" }), _jsx("button", { type: "button", onClick: () => moveWeeks(1), className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm", children: "Next 2 weeks" })] })] }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Locations" }), _jsx("div", { className: "flex flex-wrap gap-2", children: locations.map((location) => (_jsx("button", { type: "button", onClick: () => router.replace(`/schedule?locationId=${encodeURIComponent(location.id)}`), className: `rounded-md border px-2.5 py-1 text-xs font-semibold ${location.id === locationId
                                        ? "border-violet-400/70 bg-violet-500/25 text-violet-100"
                                        : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: location.name }, location.id))) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", disabled: !selectedBlock || saving, onClick: () => (selectedBlock ? createSubCoverage(selectedBlock) : null), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1 text-xs font-semibold", children: "+ Sub (Auto)" }), _jsx("button", { type: "button", disabled: !selectedBlock || saving, onClick: () => (selectedBlock ? callOutBlock(selectedBlock) : null), className: "rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200", children: "Call Out" }), _jsx("button", { type: "button", disabled: !selectedBlock || saving, onClick: () => (selectedBlock ? virtualizeBlock(selectedBlock) : null), className: "rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200", children: "Go Virtual" })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-[var(--z-muted)]", children: "Teachers" }), _jsx("div", { className: "font-semibold", children: teachers.length })] }), _jsxs("div", { className: "rounded-lg border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-[var(--z-muted)]", children: "Students" }), _jsx("div", { className: "font-semibold", children: students.length })] }), _jsxs("div", { className: "rounded-lg border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-[var(--z-muted)]", children: "Assigned blocks" }), _jsx("div", { className: "font-semibold", children: assignedBlockCount })] }), _jsxs("div", { className: "rounded-lg border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-[var(--z-muted)]", children: "Open slots" }), _jsx("div", { className: "font-semibold", children: openSlots.length })] })] }), _jsx("div", { className: "flex flex-wrap items-center gap-2", children: Array.from(new Set(projected.map((block) => block.block_date).filter(isNonEmptyString)))
                    .sort()
                    .map((date) => (_jsx("button", { type: "button", onClick: () => setSelectedDate(date), className: `rounded-md border px-2.5 py-1 text-xs font-semibold ${date === selectedDate
                        ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                        : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: dayName(date) }, date))) }), loading ? _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Loading window\u2026" }) : null, error ? _jsx("p", { className: "text-sm text-[var(--z-danger)]", children: error }) : null, _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Legend" }), legend.map((item) => (_jsx("span", { className: `rounded border px-2 py-0.5 text-[10px] font-semibold ${item.className}`, children: item.label }, item.label)))] }), _jsx("div", { className: "overflow-auto", children: _jsxs("div", { className: "grid min-w-[980px] gap-0.5", style: { gridTemplateColumns: `88px repeat(${teachersForBoard.length}, minmax(150px,1fr))` }, children: [_jsx("div", { className: "sticky left-0 z-20 bg-[var(--z-surface)] p-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Time" }), teachersForBoard.map((teacher) => {
                                    var _a;
                                    return (_jsxs("div", { className: "p-2 text-xs font-semibold text-[var(--z-fg)] border-b border-[var(--z-border)]", children: [_jsx("div", { className: "truncate", children: teacherName(teacher) }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [(_a = openByTeacher.get(teacher.id)) !== null && _a !== void 0 ? _a : 0, " open slots"] })] }, teacher.id));
                                }), _jsx("div", { className: "sticky left-0 z-10 bg-[var(--z-surface)] border-r border-[var(--z-border)]", children: slots.slice(0, -1).map((minute) => (_jsx("div", { className: "h-12 border-b border-[var(--z-border)] px-2 pt-1 text-[10px] text-[var(--z-muted)]", children: minuteToLabel(minute) }, minute))) }), teachersForBoard.map((teacher) => {
                                    var _a;
                                    const blocks = (_a = teacherBlocks.get(teacher.id)) !== null && _a !== void 0 ? _a : [];
                                    return (_jsxs("div", { className: "relative", children: [slots.slice(0, -1).map((minute) => (_jsx("div", { className: "h-12 border-b border-[var(--z-border)]/80" }, `${teacher.id}-${minute}`))), selectedDate === nowDate && nowMinute >= startMinute && nowMinute <= endMinute ? (_jsx("div", { className: "pointer-events-none absolute left-0 right-0 z-30", style: { top: ((nowMinute - startMinute) / 30) * 48 }, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" }), _jsx("div", { className: "h-px flex-1 bg-red-500 opacity-80" })] }) })) : null, _jsx("div", { className: "pointer-events-none absolute inset-0", children: blocks.map((block) => {
                                                    const start = toMinute(block.start_time);
                                                    const end = toMinute(block.end_time);
                                                    const offsetSlots = Math.max(0, (start - startMinute) / 30);
                                                    const durationSlots = Math.max(1, (end - start) / 30);
                                                    const top = offsetSlots * 48 + 2;
                                                    const height = durationSlots * 48 - 4;
                                                    const student = block.student_id ? studentNames.get(block.student_id) : null;
                                                    const family = block.student_id ? familyByStudentId.get(block.student_id) : null;
                                                    const familyLabel = family ? familyDisplayName(family) : null;
                                                    const emoji = blockEmoji(block);
                                                    return (_jsxs("div", { className: `pointer-events-auto absolute left-1 right-1 rounded border px-2 py-1 text-[11px] shadow ${blockCardClass(block)}`, style: { top, height, minHeight: 28 }, title: `${student !== null && student !== void 0 ? student : "Open"} · ${block.start_time} - ${block.end_time}`, onClick: () => setSelectedBlockId(block.id), children: [_jsxs("div", { className: "truncate font-semibold", children: [emoji, " ", student !== null && student !== void 0 ? student : "Open"] }), familyLabel ? (_jsxs("div", { className: "truncate text-[10px] opacity-80", children: ["\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 ", familyLabel] })) : null, _jsxs("div", { className: "truncate text-[10px] opacity-80", children: [block.start_time.slice(0, 5), " - ", block.end_time.slice(0, 5)] })] }, block.id));
                                                }) })] }, teacher.id));
                                })] }) })] }), cancelModalOpen && cancelTargetBlock ? (_jsxs("div", { className: "fixed inset-0 z-[80] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/60 backdrop-blur-[2px]", onClick: () => setCancelModalOpen(false), "aria-label": "Close cancel modal" }), _jsxs("div", { className: "relative z-10 w-full max-w-md rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-2xl", children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Cancel Session" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)]", children: cancelTargetBlock.student_id ? (_b = studentNames.get(cancelTargetBlock.student_id)) !== null && _b !== void 0 ? _b : "Student" : "Open block" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [cancelTargetBlock.block_date, " \u00B7 ", cancelTargetBlock.start_time.slice(0, 5), "\u2013", cancelTargetBlock.end_time.slice(0, 5)] })] }), _jsxs("label", { className: "block text-xs", children: [_jsxs("span", { className: "mb-1 block font-semibold text-[var(--z-fg)]", children: ["Reason for cancellation ", _jsx("span", { className: "text-red-400", children: "*" })] }), _jsx("textarea", { value: cancelReason, onChange: (e) => setCancelReason(e.target.value), rows: 3, placeholder: "e.g. Student sick, family emergency, teacher unavailable...", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-red-400/60" })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setCancelModalOpen(false), className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "Keep Session" }), _jsx("button", { type: "button", disabled: saving || !cancelReason.trim(), onClick: async () => {
                                            await cancelSessionWithReason(cancelTargetBlock, cancelReason.trim());
                                            setCancelModalOpen(false);
                                            setSelectedBlockId(null);
                                        }, className: "flex-1 rounded-md border border-red-400/60 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200 disabled:opacity-40", children: saving ? "Cancelling..." : "Confirm Cancel" })] })] })] })) : null, selectedBlock ? (_jsxs("div", { className: "fixed inset-0 z-[75] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/50 backdrop-blur-[2px]", onClick: () => setSelectedBlockId(null), "aria-label": "Close session details" }), _jsxs("div", { className: "relative z-10 w-full max-w-xl rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-2xl", children: [_jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Lesson Details" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: selectedBlock.student_id ? (_c = studentNames.get(selectedBlock.student_id)) !== null && _c !== void 0 ? _c : "Student" : "Open block" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [safeTeacherName(teachersById.get((_e = selectedBlock.teacher_id) !== null && _e !== void 0 ? _e : "")), " \u00B7 ", selectedBlock.block_date, " \u00B7", " ", selectedBlock.start_time.slice(0, 5), "-", selectedBlock.end_time.slice(0, 5)] }), selectedBlock.student_id && familyByStudentId.get(selectedBlock.student_id) ? (_jsxs("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: ["Family: ", familyDisplayName(familyByStudentId.get(selectedBlock.student_id))] })) : null] }), _jsx("button", { type: "button", onClick: () => setSelectedBlockId(null), className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "Close" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Session type" }), _jsx("select", { value: sessionType, onChange: (event) => setSessionType(event.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm", children: BLOCK_TYPE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Room" }), _jsxs("select", { value: roomIdDraft, onChange: (event) => setRoomIdDraft(event.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm", children: [_jsx("option", { value: "", children: "No room" }), rooms.map((room) => (_jsx("option", { value: room.id, children: room.name }, room.id)))] }), roomIdDraft && roomsById.get(roomIdDraft) ? (_jsx("span", { className: "mt-1 block text-[10px] text-[var(--z-muted)]", children: (_f = roomsById.get(roomIdDraft)) === null || _f === void 0 ? void 0 : _f.name })) : null] }), _jsx("button", { type: "button", onClick: () => setIsVirtualDraft((value) => !value), className: `w-full rounded-md border px-3 py-2 text-sm font-semibold ${isVirtualDraft
                                            ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                                            : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]"}`, children: isVirtualDraft ? "Virtual Session Enabled" : "Make Virtual (Google Meet)" }), _jsxs("div", { className: "grid grid-cols-1 gap-2 text-xs", children: [selectedBlock.student_id ? (_jsx(Link, { href: `/students/${selectedBlock.student_id}`, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[var(--z-fg)] hover:bg-white/5", children: "Open student profile" })) : null, selectedBlock.student_id &&
                                                (() => {
                                                    var _a, _b, _c, _e;
                                                    const student = studentsById.get(selectedBlock.student_id);
                                                    const familyId = student === null || student === void 0 ? void 0 : student.family_id;
                                                    const family = typeof familyId === "string" && familyId.trim()
                                                        ? familiesById.get(familyId)
                                                        : undefined;
                                                    return typeof familyId === "string" && familyId.trim() ? (_jsxs("div", { className: "space-y-1", children: [_jsx(Link, { href: `/crm?family=${familyId}`, className: "block rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[var(--z-fg)] hover:bg-white/5", children: "Open family account" }), family ? (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[11px] text-[var(--z-muted)]", children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: familyDisplayName(family) }), _jsx("div", { children: (_b = (_a = family.primary_contact_name) !== null && _a !== void 0 ? _a : family.parent_name) !== null && _b !== void 0 ? _b : "No primary contact" }), _jsx("div", { children: (_c = family.primary_email) !== null && _c !== void 0 ? _c : "No email" }), _jsx("div", { children: (_e = family.primary_phone) !== null && _e !== void 0 ? _e : "No phone" })] })) : null] })) : null;
                                                })()] })] }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("button", { type: "button", disabled: saving, onClick: () => checkInBlock(selectedBlock), className: "w-full rounded-md border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100", children: saving ? "Saving..." : "Check In" }), _jsx("button", { type: "button", disabled: saving, onClick: () => patchBlock(selectedBlock, {
                                            block_type: sessionType,
                                            status: sessionType === "open_time" || sessionType === "sub" || sessionType === "call_out" ? "available" : "booked",
                                            room_id: roomIdDraft || null,
                                            is_virtual: isVirtualDraft,
                                        }), className: "w-full rounded-md border border-yellow-300/70 bg-yellow-400 px-3 py-2 text-sm font-semibold text-black", children: "Update Appointment" }), _jsx("button", { type: "button", disabled: saving, onClick: () => {
                                            setCancelTargetBlock(selectedBlock);
                                            setCancelReason("");
                                            setCancelModalOpen(true);
                                        }, className: "w-full rounded-md border border-red-400/60 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200", children: "Cancel Session" })] })] })] })) : null] }));
}
