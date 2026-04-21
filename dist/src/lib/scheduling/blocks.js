import { createScheduleBlock, findConflictingBlocks, getScheduleBlockById, listScheduleBlocks, updateScheduleBlock, } from "@data/scheduleBlocks";
import { createSessionLog, getSessionLogByBlockId, updateSessionLog, } from "@data/sessionLog";
export async function bookBlock(tenantId, input, opts) {
    if (!(opts === null || opts === void 0 ? void 0 : opts.allowConflict)) {
        const conflicts = await findConflictingBlocks(tenantId, input.teacher_id, input.block_date, input.start_time, input.end_time);
        if (conflicts.length > 0) {
            const err = new Error("Teacher has conflicting block(s).");
            err.code = "SCHEDULE_CONFLICT";
            err.conflicts = conflicts;
            throw err;
        }
    }
    return createScheduleBlock(tenantId, input);
}
export async function rescheduleBlock(tenantId, id, patch, opts) {
    var _a, _b, _c, _d;
    const current = await getScheduleBlockById(id, tenantId);
    if (!current)
        throw new Error(`schedule_block ${id} not found`);
    const teacherId = (_a = patch.teacher_id) !== null && _a !== void 0 ? _a : current.teacher_id;
    const blockDate = (_b = patch.block_date) !== null && _b !== void 0 ? _b : current.block_date;
    const startTime = (_c = patch.start_time) !== null && _c !== void 0 ? _c : current.start_time;
    const endTime = (_d = patch.end_time) !== null && _d !== void 0 ? _d : current.end_time;
    const changed = patch.teacher_id !== undefined ||
        patch.block_date !== undefined ||
        patch.start_time !== undefined ||
        patch.end_time !== undefined;
    if (changed && !(opts === null || opts === void 0 ? void 0 : opts.allowConflict)) {
        const conflicts = await findConflictingBlocks(tenantId, teacherId, blockDate, startTime, endTime, id);
        if (conflicts.length > 0) {
            const err = new Error("Teacher has conflicting block(s).");
            err.code = "SCHEDULE_CONFLICT";
            err.conflicts = conflicts;
            throw err;
        }
    }
    return updateScheduleBlock(id, tenantId, patch);
}
export async function cancelBlock(tenantId, id, reason) {
    return updateScheduleBlock(id, tenantId, {
        status: "available",
        block_type: "call_out",
        callout_reason: reason !== null && reason !== void 0 ? reason : null,
    });
}
export async function checkInBlock(tenantId, id, checkedInBy) {
    return updateScheduleBlock(id, tenantId, {
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy,
    });
}
export async function upsertSessionLogForBlock(tenantId, blockId, data) {
    var _a, _b, _c, _d, _e, _f;
    const existing = await getSessionLogByBlockId(blockId, tenantId);
    if (existing) {
        return updateSessionLog(existing.id, tenantId, data);
    }
    const block = await getScheduleBlockById(blockId, tenantId);
    if (!block)
        throw new Error(`schedule_block ${blockId} not found`);
    if (!block.student_id) {
        throw new Error(`schedule_block ${blockId} has no student_id; cannot create session_log.`);
    }
    return createSessionLog(tenantId, Object.assign(Object.assign({}, data), { schedule_block_id: blockId, block_date: (_a = data.block_date) !== null && _a !== void 0 ? _a : block.block_date, location_id: (_b = data.location_id) !== null && _b !== void 0 ? _b : block.location_id, student_id: (_c = data.student_id) !== null && _c !== void 0 ? _c : block.student_id, teacher_id: (_d = data.teacher_id) !== null && _d !== void 0 ? _d : block.teacher_id, student_rate: (_e = data.student_rate) !== null && _e !== void 0 ? _e : 0, teacher_rate: (_f = data.teacher_rate) !== null && _f !== void 0 ? _f : 0 }));
}
export { listScheduleBlocks };
function splitDateTime(value) {
    if (value.includes("T")) {
        const [date, timePart] = value.split("T");
        const time = (timePart !== null && timePart !== void 0 ? timePart : "").replace(/(Z|[+-]\d{2}:?\d{2})$/, "").slice(0, 8);
        return { date, time: time.length >= 5 ? time : `${time}:00`.slice(0, 8) };
    }
    if (value.includes(" ")) {
        const [date, timePart] = value.split(" ");
        return { date, time: (timePart !== null && timePart !== void 0 ? timePart : "").slice(0, 8) };
    }
    throw new Error(`Invalid datetime "${value}"; expected ISO or "YYYY-MM-DD HH:MM:SS"`);
}
export async function detectConflicts(input) {
    const { date: startDate, time: startTime } = splitDateTime(input.start);
    const { date: endDate, time: endTime } = splitDateTime(input.end);
    if (startDate !== endDate) {
        throw new Error(`detectConflicts requires start and end on the same date (got ${startDate} vs ${endDate})`);
    }
    return findConflictingBlocks(input.tenantId, input.teacherId, startDate, startTime, endTime, input.excludeBlockId);
}
export async function logSession(blockId, payload, tenantId) {
    var _a, _b, _c, _d, _e, _f;
    const block = await getScheduleBlockById(blockId, tenantId);
    if (!block)
        throw new Error(`schedule_block ${blockId} not found`);
    if (!block.student_id) {
        throw new Error(`schedule_block ${blockId} has no student_id; cannot create session_log.`);
    }
    const insert = Object.assign(Object.assign({}, payload), { schedule_block_id: blockId, block_date: (_a = payload.block_date) !== null && _a !== void 0 ? _a : block.block_date, location_id: (_b = payload.location_id) !== null && _b !== void 0 ? _b : block.location_id, student_id: (_c = payload.student_id) !== null && _c !== void 0 ? _c : block.student_id, teacher_id: (_d = payload.teacher_id) !== null && _d !== void 0 ? _d : block.teacher_id, student_rate: (_e = payload.student_rate) !== null && _e !== void 0 ? _e : 0, teacher_rate: (_f = payload.teacher_rate) !== null && _f !== void 0 ? _f : 0 });
    return createSessionLog(tenantId, insert);
}
