import { getServiceClient } from "@/lib/supabase";
import { SCHEDULING_ACCENT_HEX } from "./colorSemantics";
const DAY_MS = 24 * 60 * 60 * 1000;
function normalizeRangeBoundary(value, endBoundary) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T${endBoundary ? "23:59:59.999" : "00:00:00.000"}Z`);
    }
    return new Date(value);
}
function startOfDay(d) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
function startOfWeekMonday(d) {
    const copy = startOfDay(d);
    const dow = copy.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    copy.setDate(copy.getDate() + offset);
    return copy;
}
function toTimeRange(start, end) {
    return {
        start: start.slice(0, 5),
        end: end.slice(0, 5),
    };
}
function withDayTime(day, source) {
    const next = new Date(day);
    next.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
    return next;
}
function intersectsRange(appt, range) {
    const start = normalizeRangeBoundary(range.start, false).getTime();
    const end = normalizeRangeBoundary(range.end, true).getTime();
    const apptStart = new Date(appt.startsAt).getTime();
    const apptEnd = new Date(appt.endsAt).getTime();
    return apptStart < end && apptEnd > start;
}
function parseTimeToMinutes(value) {
    const [h, m] = value.split(":");
    return Number(h) * 60 + Number(m);
}
function assertIso(value, field) {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) {
        throw new Error(`INVALID_${field.toUpperCase()}`);
    }
}
function assertDayOfWeek(dayOfWeek) {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error("INVALID_DAY_OF_WEEK");
    }
}
function normalizeTimeString(value) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value))
        throw new Error("INVALID_TIME");
    return value.length === 5 ? `${value}:00` : value;
}
function toDbError(error) {
    if (!error)
        return new Error("DATABASE_ERROR");
    if (error instanceof Error)
        return error;
    if (typeof error === "object" && error && "message" in error) {
        const message = error.message;
        return new Error(message || "DATABASE_ERROR");
    }
    return new Error("DATABASE_ERROR");
}
function overlapsWindow(aStartIso, aEndIso, bStartIso, bEndIso) {
    const aStart = new Date(aStartIso).getTime();
    const aEnd = new Date(aEndIso).getTime();
    const bStart = new Date(bStartIso).getTime();
    const bEnd = new Date(bEndIso).getTime();
    return aStart < bEnd && bStart < aEnd;
}
function mapAvailability(row, tenantId) {
    const stamp = new Date().toISOString();
    return {
        id: row.id,
        tenantId,
        scheduleId: row.scheduleId,
        dayOfWeek: row.dayOfWeek,
        range: toTimeRange(row.startTime, row.endTime),
        createdAt: stamp,
        updatedAt: stamp,
    };
}
function mapSchedule(row, availabilityRows) {
    var _a;
    return {
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        color: (_a = row.color) !== null && _a !== void 0 ? _a : SCHEDULING_ACCENT_HEX,
        timezone: "UTC",
        isActive: true,
        availabilityBlocks: availabilityRows
            .filter((block) => block.scheduleId === row.id)
            .map((block) => mapAvailability(block, row.tenantId)),
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
    };
}
function mapAppointment(row, tenantId) {
    var _a, _b, _c;
    return {
        id: row.id,
        tenantId,
        scheduleId: row.scheduleId,
        title: row.title,
        startsAt: row.start,
        endsAt: row.end,
        status: row.status,
        notes: (_a = row.notes) !== null && _a !== void 0 ? _a : null,
        recurrence: (_b = row.recurrenceRule) !== null && _b !== void 0 ? _b : null,
        color: (_c = row.color) !== null && _c !== void 0 ? _c : SCHEDULING_ACCENT_HEX,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
async function assertScheduleBelongsToTenant(tenantId, scheduleId) {
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("schedules")
        .select('id,"tenantId",name,color,"createdAt"')
        .eq("id", scheduleId)
        .eq("tenantId", tenantId)
        .maybeSingle();
    if (error)
        throw toDbError(error);
    if (!data)
        throw new Error("SCHEDULE_NOT_FOUND");
    return data;
}
async function listAvailabilityRows(scheduleIds) {
    if (scheduleIds.length === 0)
        return [];
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("availability_blocks")
        .select('id,"scheduleId","dayOfWeek","startTime","endTime"')
        .in("scheduleId", scheduleIds)
        .order("dayOfWeek", { ascending: true })
        .order("startTime", { ascending: true });
    if (error)
        throw toDbError(error);
    return (data !== null && data !== void 0 ? data : []);
}
export async function listSchedules(tenantId) {
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("schedules")
        .select('id,"tenantId",name,color,"createdAt"')
        .eq("tenantId", tenantId)
        .order("createdAt", { ascending: true });
    if (error)
        throw toDbError(error);
    const scheduleRows = (data !== null && data !== void 0 ? data : []);
    const availabilityRows = await listAvailabilityRows(scheduleRows.map((row) => row.id));
    return scheduleRows.map((row) => mapSchedule(row, availabilityRows));
}
export async function getSchedule(tenantId, scheduleId) {
    const row = await assertScheduleBelongsToTenant(tenantId, scheduleId).catch((error) => {
        if (error instanceof Error && error.message === "SCHEDULE_NOT_FOUND")
            return null;
        throw error;
    });
    if (!row)
        return null;
    const availabilityRows = await listAvailabilityRows([scheduleId]);
    return mapSchedule(row, availabilityRows);
}
export async function createSchedule(tenantId, input) {
    var _a;
    const name = input.name.trim();
    if (!name)
        throw new Error("INVALID_SCHEDULE_NAME");
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("schedules")
        .insert({
        tenantId,
        name,
        color: ((_a = input.color) === null || _a === void 0 ? void 0 : _a.trim()) || SCHEDULING_ACCENT_HEX,
    })
        .select('id,"tenantId",name,color,"createdAt"')
        .single();
    if (error)
        throw toDbError(error);
    return mapSchedule(data, []);
}
export async function updateSchedule(tenantId, scheduleId, patch) {
    var _a;
    await assertScheduleBelongsToTenant(tenantId, scheduleId);
    const updatePayload = {};
    if (patch.name !== undefined) {
        const name = patch.name.trim();
        if (!name)
            throw new Error("INVALID_SCHEDULE_NAME");
        updatePayload.name = name;
    }
    if (patch.color !== undefined) {
        updatePayload.color = ((_a = patch.color) === null || _a === void 0 ? void 0 : _a.trim()) || SCHEDULING_ACCENT_HEX;
    }
    if (Object.keys(updatePayload).length === 0) {
        const existing = await getSchedule(tenantId, scheduleId);
        if (!existing)
            throw new Error("SCHEDULE_NOT_FOUND");
        return existing;
    }
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("schedules")
        .update(updatePayload)
        .eq("id", scheduleId)
        .eq("tenantId", tenantId)
        .select('id,"tenantId",name,color,"createdAt"')
        .single();
    if (error)
        throw toDbError(error);
    const availabilityRows = await listAvailabilityRows([scheduleId]);
    return mapSchedule(data, availabilityRows);
}
export async function createAvailabilityBlock(tenantId, scheduleId, input) {
    await assertScheduleBelongsToTenant(tenantId, scheduleId);
    assertDayOfWeek(input.dayOfWeek);
    const startTime = normalizeTimeString(input.startTime);
    const endTime = normalizeTimeString(input.endTime);
    if (endTime <= startTime)
        throw new Error("INVALID_TIME_RANGE");
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("availability_blocks")
        .insert({
        scheduleId,
        dayOfWeek: input.dayOfWeek,
        startTime,
        endTime,
    })
        .select('id,"scheduleId","dayOfWeek","startTime","endTime"')
        .single();
    if (error)
        throw toDbError(error);
    return mapAvailability(data, tenantId);
}
async function getAvailabilityBlock(tenantId, blockId) {
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("availability_blocks")
        .select('id,"scheduleId","dayOfWeek","startTime","endTime",schedules!inner("tenantId")')
        .eq("id", blockId)
        .eq('schedules."tenantId"', tenantId)
        .maybeSingle();
    if (error)
        throw toDbError(error);
    if (!data)
        throw new Error("AVAILABILITY_BLOCK_NOT_FOUND");
    const row = data;
    return {
        id: row.id,
        scheduleId: row.scheduleId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
    };
}
export async function updateAvailabilityBlock(tenantId, blockId, patch) {
    var _a, _b, _c;
    const current = await getAvailabilityBlock(tenantId, blockId);
    const dayOfWeek = (_a = patch.dayOfWeek) !== null && _a !== void 0 ? _a : current.dayOfWeek;
    const startTime = normalizeTimeString((_b = patch.startTime) !== null && _b !== void 0 ? _b : current.startTime);
    const endTime = normalizeTimeString((_c = patch.endTime) !== null && _c !== void 0 ? _c : current.endTime);
    assertDayOfWeek(dayOfWeek);
    if (endTime <= startTime)
        throw new Error("INVALID_TIME_RANGE");
    const db = getServiceClient().schema("scheduling");
    const { data, error } = await db
        .from("availability_blocks")
        .update({
        dayOfWeek,
        startTime,
        endTime,
    })
        .eq("id", blockId)
        .eq("scheduleId", current.scheduleId)
        .select('id,"scheduleId","dayOfWeek","startTime","endTime"')
        .single();
    if (error)
        throw toDbError(error);
    return mapAvailability(data, tenantId);
}
export async function deleteAvailabilityBlock(tenantId, blockId) {
    const current = await getAvailabilityBlock(tenantId, blockId);
    const db = getServiceClient().schema("scheduling");
    const { error } = await db
        .from("availability_blocks")
        .delete()
        .eq("id", blockId)
        .eq("scheduleId", current.scheduleId);
    if (error)
        throw toDbError(error);
}
export async function listAvailability(tenantId, scheduleId, range) {
    await assertScheduleBelongsToTenant(tenantId, scheduleId);
    const blocks = await listAvailabilityRows([scheduleId]);
    const start = startOfDay(normalizeRangeBoundary(range.start, false));
    const end = startOfDay(normalizeRangeBoundary(range.end, true));
    const expanded = [];
    for (let ts = start.getTime(); ts <= end.getTime(); ts += DAY_MS) {
        const day = new Date(ts);
        const dow = day.getDay();
        for (const block of blocks) {
            if (block.dayOfWeek !== dow)
                continue;
            const startMinutes = parseTimeToMinutes(block.startTime);
            const endMinutes = parseTimeToMinutes(block.endTime);
            const startsAt = new Date(day);
            startsAt.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
            const endsAt = new Date(day);
            endsAt.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
            expanded.push({
                id: `${block.id}:${startsAt.toISOString().slice(0, 10)}`,
                sourceBlockId: block.id,
                tenantId,
                scheduleId,
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
            });
        }
    }
    return expanded;
}
export function expandRecurrence(appointment, range) {
    var _a, _b, _c;
    if (!appointment.recurrence) {
        return intersectsRange(appointment, range) ? [appointment] : [];
    }
    const rangeStart = normalizeRangeBoundary(range.start, false);
    const rangeEnd = normalizeRangeBoundary(range.end, true);
    const baseStart = new Date(appointment.startsAt);
    const baseEnd = new Date(appointment.endsAt);
    const durationMs = Math.max(15 * 60000, baseEnd.getTime() - baseStart.getTime());
    const until = appointment.recurrence.type === "custom" && appointment.recurrence.until
        ? new Date(appointment.recurrence.until)
        : null;
    const occurrences = [];
    const pushOccurrence = (candidateStart) => {
        if (until && candidateStart.getTime() > until.getTime())
            return;
        const candidateEnd = new Date(candidateStart.getTime() + durationMs);
        const inRange = candidateStart < rangeEnd && candidateEnd > rangeStart;
        if (!inRange)
            return;
        const id = candidateStart.getTime() === baseStart.getTime()
            ? appointment.id
            : `${appointment.id}::${candidateStart.toISOString()}`;
        occurrences.push(Object.assign(Object.assign({}, appointment), { id, startsAt: candidateStart.toISOString(), endsAt: candidateEnd.toISOString(), seriesParentId: appointment.id }));
    };
    if (appointment.recurrence.type === "weekly") {
        const interval = Math.max(1, (_a = appointment.recurrence.interval) !== null && _a !== void 0 ? _a : 1);
        const weekdays = ((_b = appointment.recurrence.weekdays) === null || _b === void 0 ? void 0 : _b.length)
            ? appointment.recurrence.weekdays
            : [baseStart.getDay()];
        for (let day = startOfDay(rangeStart); day <= rangeEnd; day = new Date(day.getTime() + DAY_MS)) {
            if (!weekdays.includes(day.getDay()))
                continue;
            const weekDistance = Math.floor((startOfWeekMonday(day).getTime() - startOfWeekMonday(baseStart).getTime()) / (7 * DAY_MS));
            if (weekDistance < 0 || weekDistance % interval !== 0)
                continue;
            pushOccurrence(withDayTime(day, baseStart));
        }
        return occurrences;
    }
    const intervalDays = Math.max(1, (_c = appointment.recurrence.interval) !== null && _c !== void 0 ? _c : 1);
    let cursor = new Date(baseStart);
    if (cursor < rangeStart) {
        const deltaDays = Math.max(0, Math.floor((rangeStart.getTime() - cursor.getTime()) / DAY_MS / intervalDays) - 1);
        cursor = new Date(cursor.getTime() + deltaDays * intervalDays * DAY_MS);
    }
    while (cursor <= rangeEnd) {
        pushOccurrence(cursor);
        cursor = new Date(cursor.getTime() + intervalDays * DAY_MS);
    }
    return occurrences;
}
export async function listAppointments(tenantId, scheduleId, range) {
    await assertScheduleBelongsToTenant(tenantId, scheduleId);
    const db = getServiceClient().schema("scheduling");
    const rangeStart = normalizeRangeBoundary(range.start, false).toISOString();
    const rangeEnd = normalizeRangeBoundary(range.end, true).toISOString();
    const { data, error } = await db
        .from("appointments")
        .select('id,"scheduleId",title,start,"end",status,notes,color,"recurrenceRule","createdAt","updatedAt"')
        .eq("scheduleId", scheduleId)
        .gte("start", rangeStart)
        .lte("start", rangeEnd)
        .order("start", { ascending: true });
    if (error)
        throw toDbError(error);
    return (data !== null && data !== void 0 ? data : []).flatMap((row) => expandRecurrence(mapAppointment(row, tenantId), range));
}
async function assertSchedulableWindow(tenantId, scheduleId, startsAt, endsAt, options) {
    var _a, _b, _c;
    const db = getServiceClient().schema("scheduling");
    const ignoreId = ((_a = options === null || options === void 0 ? void 0 : options.ignoreAppointmentId) === null || _a === void 0 ? void 0 : _a.includes("::"))
        ? options.ignoreAppointmentId.split("::")[0]
        : (_b = options === null || options === void 0 ? void 0 : options.ignoreAppointmentId) !== null && _b !== void 0 ? _b : null;
    const [availabilityRows, overlappingRows] = await Promise.all([
        listAvailabilityRows([scheduleId]),
        db
            .from("appointments")
            .select('id,"scheduleId",title,start,"end",status,notes,color,"recurrenceRule","createdAt","updatedAt"')
            .eq("scheduleId", scheduleId)
            .lt("start", endsAt)
            .gt("end", startsAt),
    ]);
    if (overlappingRows.error)
        throw toDbError(overlappingRows.error);
    const range = { start: startsAt, end: endsAt };
    const hasOverlap = ((_c = overlappingRows.data) !== null && _c !== void 0 ? _c : [])
        .flatMap((row) => expandRecurrence(mapAppointment(row, tenantId), range))
        .filter((appt) => appt.id !== ignoreId && appt.seriesParentId !== ignoreId)
        .some((appt) => overlapsWindow(appt.startsAt, appt.endsAt, startsAt, endsAt));
    if (hasOverlap) {
        throw new Error("APPOINTMENT_OVERLAP");
    }
    if (availabilityRows.length === 0)
        return;
    const expanded = await listAvailability(tenantId, scheduleId, range);
    const isInsideSlot = expanded.some((slot) => {
        const slotStart = new Date(slot.startsAt).getTime();
        const slotEnd = new Date(slot.endsAt).getTime();
        const start = new Date(startsAt).getTime();
        const end = new Date(endsAt).getTime();
        return start >= slotStart && end <= slotEnd;
    });
    if (!isInsideSlot) {
        throw new Error("OUTSIDE_AVAILABILITY");
    }
}
export async function createAppointment(tenantId, scheduleId, data) {
    var _a, _b, _c, _d;
    await assertScheduleBelongsToTenant(tenantId, scheduleId);
    assertIso(data.startsAt, "startsAt");
    assertIso(data.endsAt, "endsAt");
    if (new Date(data.endsAt).getTime() <= new Date(data.startsAt).getTime()) {
        throw new Error("INVALID_TIME_RANGE");
    }
    await assertSchedulableWindow(tenantId, scheduleId, data.startsAt, data.endsAt);
    const db = getServiceClient().schema("scheduling");
    const { data: saved, error } = await db
        .from("appointments")
        .insert({
        scheduleId,
        title: data.title.trim() || "Untitled appointment",
        start: data.startsAt,
        end: data.endsAt,
        status: (_a = data.status) !== null && _a !== void 0 ? _a : "scheduled",
        notes: (_b = data.notes) !== null && _b !== void 0 ? _b : null,
        recurrenceRule: (_c = data.recurrence) !== null && _c !== void 0 ? _c : null,
        color: (_d = data.color) !== null && _d !== void 0 ? _d : SCHEDULING_ACCENT_HEX,
    })
        .select('id,"scheduleId",title,start,"end",status,notes,color,"recurrenceRule","createdAt","updatedAt"')
        .single();
    if (error)
        throw toDbError(error);
    return mapAppointment(saved, tenantId);
}
export async function updateAppointment(tenantId, appointmentId, patch) {
    var _a, _b;
    const normalizedId = appointmentId.includes("::") ? appointmentId.split("::")[0] : appointmentId;
    const db = getServiceClient().schema("scheduling");
    const { data: currentRaw, error: currentError } = await db
        .from("appointments")
        .select('id,"scheduleId",title,start,"end",status,notes,color,"recurrenceRule","createdAt","updatedAt",schedules!inner("tenantId")')
        .eq("id", normalizedId)
        .eq('schedules."tenantId"', tenantId)
        .maybeSingle();
    if (currentError)
        throw toDbError(currentError);
    if (!currentRaw)
        throw new Error("APPOINTMENT_NOT_FOUND");
    const current = currentRaw;
    const startsAt = (_a = patch.startsAt) !== null && _a !== void 0 ? _a : current.start;
    const endsAt = (_b = patch.endsAt) !== null && _b !== void 0 ? _b : current.end;
    if (patch.startsAt)
        assertIso(patch.startsAt, "startsAt");
    if (patch.endsAt)
        assertIso(patch.endsAt, "endsAt");
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        throw new Error("INVALID_TIME_RANGE");
    }
    await assertSchedulableWindow(tenantId, current.scheduleId, startsAt, endsAt, {
        ignoreAppointmentId: current.id,
    });
    const updatePayload = {};
    if (patch.title !== undefined)
        updatePayload.title = patch.title.trim() || "Untitled appointment";
    if (patch.startsAt !== undefined)
        updatePayload.start = patch.startsAt;
    if (patch.endsAt !== undefined)
        updatePayload.end = patch.endsAt;
    if (patch.status !== undefined)
        updatePayload.status = patch.status;
    if (patch.notes !== undefined)
        updatePayload.notes = patch.notes;
    if (patch.recurrence !== undefined)
        updatePayload.recurrenceRule = patch.recurrence;
    if (patch.color !== undefined)
        updatePayload.color = patch.color;
    const { data: saved, error } = await db
        .from("appointments")
        .update(updatePayload)
        .eq("id", normalizedId)
        .eq("scheduleId", current.scheduleId)
        .select('id,"scheduleId",title,start,"end",status,notes,color,"recurrenceRule","createdAt","updatedAt"')
        .single();
    if (error)
        throw toDbError(error);
    return mapAppointment(saved, tenantId);
}
export function detectConflicts(appointments, availability = []) {
    const conflicts = [];
    const seen = new Set();
    const sorted = [...appointments].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i];
        const currentStart = new Date(current.startsAt).getTime();
        const currentEnd = new Date(current.endsAt).getTime();
        for (let j = i + 1; j < sorted.length; j += 1) {
            const next = sorted[j];
            if (next.scheduleId !== current.scheduleId)
                continue;
            const nextStart = new Date(next.startsAt).getTime();
            const nextEnd = new Date(next.endsAt).getTime();
            if (nextStart >= currentEnd)
                break;
            if (nextStart < currentEnd && nextEnd > currentStart) {
                const keyA = `${current.id}:overlap:${next.id}`;
                const keyB = `${next.id}:overlap:${current.id}`;
                if (!seen.has(keyA)) {
                    seen.add(keyA);
                    conflicts.push({
                        appointmentId: current.id,
                        type: "overlap",
                        conflictingWith: next.id,
                    });
                }
                if (!seen.has(keyB)) {
                    seen.add(keyB);
                    conflicts.push({
                        appointmentId: next.id,
                        type: "overlap",
                        conflictingWith: current.id,
                    });
                }
            }
        }
    }
    if (availability.length > 0) {
        for (const appointment of appointments) {
            const start = new Date(appointment.startsAt).getTime();
            const end = new Date(appointment.endsAt).getTime();
            const withinAvailability = availability.some((slot) => {
                if (slot.scheduleId !== appointment.scheduleId)
                    return false;
                const slotStart = new Date(slot.startsAt).getTime();
                const slotEnd = new Date(slot.endsAt).getTime();
                return start >= slotStart && end <= slotEnd;
            });
            if (!withinAvailability) {
                const key = `${appointment.id}:outsideAvailability`;
                if (!seen.has(key)) {
                    seen.add(key);
                    conflicts.push({
                        appointmentId: appointment.id,
                        type: "outsideAvailability",
                    });
                }
            }
        }
    }
    return conflicts;
}
export function getAppointmentRange(appt) {
    return {
        start: appt.startsAt.slice(11, 16),
        end: appt.endsAt.slice(11, 16),
    };
}
