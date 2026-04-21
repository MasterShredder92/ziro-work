import { eachDayInclusive, parseIsoDate } from "./window";
function toMinuteOfDay(value) {
    const [h, m] = value.split(":");
    const hh = Number(h);
    const mm = Number(m);
    return hh * 60 + mm;
}
function toTimeString(minutes) {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}:00`;
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
function isCallOutBlock(block) {
    return (block.block_type === "call_out" ||
        Boolean(block.callout_id) ||
        Boolean(block.is_family_callout));
}
function statusIsException(block) {
    return isCallOutBlock(block);
}
function blockOccupiesSlot(block) {
    if (isCallOutBlock(block))
        return false;
    if (block.block_type === "open_time")
        return false;
    if (block.student_id)
        return true;
    if (block.is_makeup_session || block.block_type === "makeup_session")
        return true;
    return true;
}
function weekDayIso(isoDate) {
    return parseIsoDate(isoDate).getUTCDay();
}
function parseRecurrenceEndDate(block) {
    if (!block.ai_context || typeof block.ai_context !== "object" || Array.isArray(block.ai_context)) {
        return null;
    }
    const ctx = block.ai_context;
    const candidate = ctx.recurrence_end_date;
    if (typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate))
        return candidate;
    return null;
}
export function projectBlocksForWindow(blocks, start, end) {
    const days = eachDayInclusive(start, end);
    const recurring = blocks.filter((b) => b.is_recurring);
    const singles = blocks.filter((b) => !b.is_recurring);
    const exceptionKey = (teacherId, date, startTime, endTime) => `${teacherId}|${date}|${startTime}|${endTime}`;
    const exceptions = new Set();
    for (const b of singles) {
        if (!b.teacher_id)
            continue;
        if (!statusIsException(b) &&
            !b.is_makeup_session &&
            b.block_type !== "makeup_session")
            continue;
        exceptions.add(exceptionKey(b.teacher_id, b.block_date, b.start_time, b.end_time));
    }
    const projected = singles.map((b) => (Object.assign(Object.assign({}, b), { source_block_id: b.id })));
    for (const base of recurring) {
        const baseWeekday = weekDayIso(base.block_date);
        const recurrenceEnd = parseRecurrenceEndDate(base);
        for (const date of days) {
            if (weekDayIso(date) !== baseWeekday)
                continue;
            if (date < base.block_date)
                continue;
            if (recurrenceEnd && date > recurrenceEnd)
                continue;
            if (exceptions.has(exceptionKey(base.teacher_id, date, base.start_time, base.end_time))) {
                continue;
            }
            projected.push(Object.assign(Object.assign({}, base), { id: `${base.id}:${date}`, block_date: date, source_block_id: base.id }));
        }
    }
    projected.sort((a, b) => a.block_date === b.block_date
        ? a.start_time.localeCompare(b.start_time)
        : a.block_date.localeCompare(b.block_date));
    return projected;
}
export function computeOpenSlotsForWindow(input) {
    var _a, _b, _c, _d, _e;
    const { teacherIds, availability, projectedBlocks, start, end } = input;
    const days = eachDayInclusive(start, end);
    const availabilityByTeacher = new Map();
    for (const row of availability) {
        const list = (_a = availabilityByTeacher.get(row.teacher_id)) !== null && _a !== void 0 ? _a : [];
        list.push(row);
        availabilityByTeacher.set(row.teacher_id, list);
    }
    const occupiedByTeacherDate = new Map();
    for (const block of projectedBlocks) {
        if (!block.teacher_id)
            continue;
        if (!blockOccupiesSlot(block))
            continue;
        const key = `${block.teacher_id}|${block.block_date}`;
        const list = (_b = occupiedByTeacherDate.get(key)) !== null && _b !== void 0 ? _b : [];
        list.push({
            start: toMinuteOfDay(block.start_time),
            end: toMinuteOfDay(block.end_time),
        });
        occupiedByTeacherDate.set(key, list);
    }
    const out = [];
    for (const teacherId of teacherIds) {
        const teacherAvail = (_c = availabilityByTeacher.get(teacherId)) !== null && _c !== void 0 ? _c : [];
        for (const day of days) {
            const dow = weekDayIso(day);
            const windows = teacherAvail.filter((a) => dayOfWeekToIndex(String(a.day_of_week)) === dow);
            if (windows.length === 0)
                continue;
            const occupied = (_e = (_d = occupiedByTeacherDate.get(`${teacherId}|${day}`)) === null || _d === void 0 ? void 0 : _d.slice().sort((a, b) => a.start - b.start)) !== null && _e !== void 0 ? _e : [];
            for (const slot of windows) {
                let cursor = toMinuteOfDay(slot.start_time);
                const slotEnd = toMinuteOfDay(slot.end_time);
                for (const taken of occupied) {
                    if (taken.end <= cursor)
                        continue;
                    if (taken.start >= slotEnd)
                        break;
                    if (taken.start > cursor) {
                        out.push({
                            teacherId,
                            date: day,
                            startTime: toTimeString(cursor),
                            endTime: toTimeString(Math.min(taken.start, slotEnd)),
                        });
                    }
                    cursor = Math.max(cursor, taken.end);
                    if (cursor >= slotEnd)
                        break;
                }
                if (cursor < slotEnd) {
                    out.push({
                        teacherId,
                        date: day,
                        startTime: toTimeString(cursor),
                        endTime: toTimeString(slotEnd),
                    });
                }
            }
        }
    }
    return out;
}
