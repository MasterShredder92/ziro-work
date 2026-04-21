import { createLessonEvent as createEventRow, deleteLessonEvent as deleteEventRow, getLessonEvent, listLessonEvents, updateLessonEvent as updateEventRow, } from "@data/lessonEvents";
import { computeEventConflicts } from "./availability";
function overlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}
export async function listEvents(tenantId, input) {
    var _a, _b, _c;
    const filter = {
        teacher_id: input === null || input === void 0 ? void 0 : input.teacherId,
        student_id: input === null || input === void 0 ? void 0 : input.studentId,
        family_id: input === null || input === void 0 ? void 0 : input.familyId,
        room_id: input === null || input === void 0 ? void 0 : input.roomId,
        location_id: input === null || input === void 0 ? void 0 : input.locationId,
        status: input === null || input === void 0 ? void 0 : input.status,
        kind: input === null || input === void 0 ? void 0 : input.kind,
        recurrence_id: input === null || input === void 0 ? void 0 : input.recurrenceId,
        start_from: (_a = input === null || input === void 0 ? void 0 : input.range) === null || _a === void 0 ? void 0 : _a.start,
        start_to: (_b = input === null || input === void 0 ? void 0 : input.range) === null || _b === void 0 ? void 0 : _b.end,
    };
    return listLessonEvents(tenantId, filter, { limit: (_c = input === null || input === void 0 ? void 0 : input.limit) !== null && _c !== void 0 ? _c : 500 });
}
export async function getEvent(tenantId, id) {
    return getLessonEvent(id, tenantId);
}
async function findConflictingEvents(tenantId, input, excludeId) {
    const bufferStart = new Date(new Date(input.startTime).getTime() - 24 * 60 * 60 * 1000).toISOString();
    const bufferEnd = new Date(new Date(input.endTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const all = await listLessonEvents(tenantId, { start_from: bufferStart, start_to: bufferEnd }, { limit: 1000 });
    return all.filter((ev) => {
        if (ev.id === excludeId)
            return false;
        if (!overlap(input.startTime, input.endTime, ev.startTime, ev.endTime)) {
            return false;
        }
        if (input.teacherId && ev.teacherId === input.teacherId)
            return true;
        if (input.roomId && ev.roomId === input.roomId)
            return true;
        if (input.studentId && ev.studentId === input.studentId)
            return true;
        return false;
    });
}
export async function createEvent(tenantId, input, opts) {
    if (!(opts === null || opts === void 0 ? void 0 : opts.allowConflict)) {
        const conflicts = await findConflictingEvents(tenantId, {
            startTime: input.startTime,
            endTime: input.endTime,
            teacherId: input.teacherId,
            studentId: input.studentId,
            roomId: input.roomId,
        });
        if (conflicts.length > 0) {
            const err = new Error("Event conflicts with existing schedule.");
            err.code = "SCHEDULE_CONFLICT";
            err.conflicts = conflicts;
            throw err;
        }
    }
    return createEventRow(tenantId, Object.assign(Object.assign({}, input), { tenantId }));
}
export async function updateEvent(tenantId, id, patch, opts) {
    var _a, _b, _c, _d, _e;
    const current = await getLessonEvent(id, tenantId);
    if (!current)
        throw new Error(`lesson_event ${id} not found`);
    const next = {
        startTime: (_a = patch.startTime) !== null && _a !== void 0 ? _a : current.startTime,
        endTime: (_b = patch.endTime) !== null && _b !== void 0 ? _b : current.endTime,
        teacherId: (_c = patch.teacherId) !== null && _c !== void 0 ? _c : current.teacherId,
        studentId: (_d = patch.studentId) !== null && _d !== void 0 ? _d : current.studentId,
        roomId: (_e = patch.roomId) !== null && _e !== void 0 ? _e : current.roomId,
    };
    const timingOrAssignmentChanged = patch.startTime !== undefined ||
        patch.endTime !== undefined ||
        patch.teacherId !== undefined ||
        patch.studentId !== undefined ||
        patch.roomId !== undefined;
    if (timingOrAssignmentChanged && !(opts === null || opts === void 0 ? void 0 : opts.allowConflict)) {
        const conflicts = await findConflictingEvents(tenantId, next, id);
        if (conflicts.length > 0) {
            const err = new Error("Update conflicts with existing schedule.");
            err.code = "SCHEDULE_CONFLICT";
            err.conflicts = conflicts;
            throw err;
        }
    }
    return updateEventRow(id, tenantId, patch);
}
export async function deleteEvent(tenantId, id) {
    await deleteEventRow(id, tenantId);
}
export async function listEventsWithConflicts(tenantId, input) {
    const events = await listEvents(tenantId, input);
    const conflicts = computeEventConflicts(events);
    return { events, conflicts };
}
