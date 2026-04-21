import { createTeacherAvailability, deleteTeacherAvailability, listTeacherAvailability, updateTeacherAvailability, } from "@data/teacherAvailability";
import { listLessonEvents } from "@data/lessonEvents";
import { listRoomBookings } from "@data/roomBookings";
export async function getTeacherWeeklyAvailability(tenantId, teacherId) {
    const slots = await listTeacherAvailability(tenantId, {
        teacher_id: teacherId,
    });
    return { tenantId, teacherId, slots };
}
export async function setTeacherAvailability(tenantId, teacherId, slots) {
    const existing = await listTeacherAvailability(tenantId, {
        teacher_id: teacherId,
    });
    for (const e of existing) {
        await deleteTeacherAvailability(e.id, tenantId);
    }
    const created = [];
    for (const slot of slots) {
        const row = await createTeacherAvailability(tenantId, Object.assign(Object.assign({}, slot), { tenantId,
            teacherId }));
        created.push(row);
    }
    return created;
}
export async function upsertTeacherAvailabilitySlot(tenantId, id, input) {
    if (id) {
        return updateTeacherAvailability(id, tenantId, input);
    }
    const ins = input;
    return createTeacherAvailability(tenantId, Object.assign(Object.assign({}, ins), { tenantId }));
}
function overlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}
export async function detectEventConflicts(tenantId, range) {
    const events = await listLessonEvents(tenantId, { start_from: range.start, start_to: range.end }, { limit: 5000 });
    return computeEventConflicts(events);
}
export function computeEventConflicts(events) {
    var _a, _b, _c, _d, _e, _f;
    const conflicts = [];
    for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
            const a = events[i];
            const b = events[j];
            if (!overlap(a.startTime, a.endTime, b.startTime, b.endTime))
                continue;
            if (a.teacherId && b.teacherId && a.teacherId === b.teacherId) {
                conflicts.push({
                    id: `${a.id}__${b.id}__teacher`,
                    kind: "teacher_overlap",
                    eventIds: [a.id, b.id],
                    startTime: a.startTime,
                    endTime: a.endTime,
                    teacherId: a.teacherId,
                    roomId: (_a = a.roomId) !== null && _a !== void 0 ? _a : null,
                    studentId: (_b = a.studentId) !== null && _b !== void 0 ? _b : null,
                    reason: "Teacher double-booked",
                });
            }
            if (a.roomId && b.roomId && a.roomId === b.roomId) {
                conflicts.push({
                    id: `${a.id}__${b.id}__room`,
                    kind: "room_overlap",
                    eventIds: [a.id, b.id],
                    startTime: a.startTime,
                    endTime: a.endTime,
                    teacherId: (_c = a.teacherId) !== null && _c !== void 0 ? _c : null,
                    roomId: a.roomId,
                    studentId: (_d = a.studentId) !== null && _d !== void 0 ? _d : null,
                    reason: "Room double-booked",
                });
            }
            if (a.studentId && b.studentId && a.studentId === b.studentId) {
                conflicts.push({
                    id: `${a.id}__${b.id}__student`,
                    kind: "student_overlap",
                    eventIds: [a.id, b.id],
                    startTime: a.startTime,
                    endTime: a.endTime,
                    teacherId: (_e = a.teacherId) !== null && _e !== void 0 ? _e : null,
                    roomId: (_f = a.roomId) !== null && _f !== void 0 ? _f : null,
                    studentId: a.studentId,
                    reason: "Student double-booked",
                });
            }
        }
    }
    return conflicts;
}
export async function getRoomBookingsInRange(tenantId, roomId, range) {
    return listRoomBookings(tenantId, { room_id: roomId, start_from: range.start, start_to: range.end }, { limit: 5000 });
}
export function isTeacherAvailableAt(availability, start, end) {
    const startDate = new Date(start);
    const dow = startDate.getUTCDay();
    const startMin = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
    const endDate = new Date(end);
    const endMin = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
    for (const a of availability) {
        if (a.dayOfWeek !== dow)
            continue;
        const [ah, am] = a.startTime.split(":").map((s) => Number(s));
        const [bh, bm] = a.endTime.split(":").map((s) => Number(s));
        const aStart = ah * 60 + am;
        const aEnd = bh * 60 + bm;
        if (startMin >= aStart && endMin <= aEnd)
            return true;
    }
    return false;
}
