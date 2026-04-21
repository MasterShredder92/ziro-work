import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "lesson_events";
const g = globalThis;
function store() {
    if (!g.__ziro_lesson_events_store)
        g.__ziro_lesson_events_store = new Map();
    return g.__ziro_lesson_events_store;
}
function rowToEvent(r) {
    return {
        id: r.id,
        tenantId: r.tenant_id,
        recurrenceId: r.recurrence_id,
        title: r.title,
        kind: r.kind,
        status: r.status,
        teacherId: r.teacher_id,
        studentId: r.student_id,
        familyId: r.family_id,
        roomId: r.room_id,
        locationId: r.location_id,
        startTime: r.start_time,
        endTime: r.end_time,
        notes: r.notes,
        color: r.color,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function eventToRow(tenantId, input) {
    var _a, _b, _c, _d, _e;
    const now = new Date().toISOString();
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : `evt_${Math.random().toString(36).slice(2, 10)}`;
    return {
        id,
        tenant_id: tenantId,
        recurrence_id: (_b = input.recurrenceId) !== null && _b !== void 0 ? _b : null,
        title: input.title,
        kind: input.kind,
        status: input.status,
        teacher_id: input.teacherId,
        student_id: input.studentId,
        family_id: input.familyId,
        room_id: input.roomId,
        location_id: input.locationId,
        start_time: input.startTime,
        end_time: input.endTime,
        notes: (_c = input.notes) !== null && _c !== void 0 ? _c : null,
        color: (_d = input.color) !== null && _d !== void 0 ? _d : null,
        created_by: (_e = input.createdBy) !== null && _e !== void 0 ? _e : null,
        created_at: now,
        updated_at: now,
    };
}
function matches(r, tenantId, filter) {
    if (r.tenant_id !== tenantId)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.teacher_id) && r.teacher_id !== filter.teacher_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.student_id) && r.student_id !== filter.student_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.family_id) && r.family_id !== filter.family_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.room_id) && r.room_id !== filter.room_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.location_id) && r.location_id !== filter.location_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.recurrence_id) && r.recurrence_id !== filter.recurrence_id)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.status) && r.status !== filter.status)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.kind) && r.kind !== filter.kind)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.start_from) && r.start_time < filter.start_from)
        return false;
    if ((filter === null || filter === void 0 ? void 0 : filter.start_to) && r.start_time > filter.start_to)
        return false;
    return true;
}
export async function listLessonEvents(tenantId, filter, opts) {
    var _a, _b, _c, _d, _e, _f;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
                q = q.eq("teacher_id", filter.teacher_id);
            if (filter === null || filter === void 0 ? void 0 : filter.student_id)
                q = q.eq("student_id", filter.student_id);
            if (filter === null || filter === void 0 ? void 0 : filter.family_id)
                q = q.eq("family_id", filter.family_id);
            if (filter === null || filter === void 0 ? void 0 : filter.room_id)
                q = q.eq("room_id", filter.room_id);
            if (filter === null || filter === void 0 ? void 0 : filter.location_id)
                q = q.eq("location_id", filter.location_id);
            if (filter === null || filter === void 0 ? void 0 : filter.recurrence_id)
                q = q.eq("recurrence_id", filter.recurrence_id);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                q = q.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.kind)
                q = q.eq("kind", filter.kind);
            if (filter === null || filter === void 0 ? void 0 : filter.start_from)
                q = q.gte("start_time", filter.start_from);
            if (filter === null || filter === void 0 ? void 0 : filter.start_to)
                q = q.lte("start_time", filter.start_to);
            const ordered = applyListOptions(q, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "start_time",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return ((_d = data) !== null && _d !== void 0 ? _d : []).map(rowToEvent);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const all = Array.from(store().values()).filter((r) => matches(r, tenantId, filter));
    all.sort((a, b) => (a.start_time < b.start_time ? -1 : 1));
    const offset = (_e = opts === null || opts === void 0 ? void 0 : opts.offset) !== null && _e !== void 0 ? _e : 0;
    const limit = (_f = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _f !== void 0 ? _f : 500;
    return all.slice(offset, offset + limit).map(rowToEvent);
}
export async function getLessonEvent(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .maybeSingle();
            if (!error)
                return data ? rowToEvent(data) : null;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const r = store().get(id);
    if (!r || r.tenant_id !== tenantId)
        return null;
    return rowToEvent(r);
}
export async function createLessonEvent(tenantId, input) {
    const row = eventToRow(tenantId, input);
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .insert(row)
                .select("*")
                .single();
            if (!error)
                return rowToEvent(data);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    store().set(row.id, row);
    return rowToEvent(row);
}
export async function updateLessonEvent(id, tenantId, patch) {
    const now = new Date().toISOString();
    const update = { updated_at: now };
    if (patch.title !== undefined)
        update.title = patch.title;
    if (patch.kind !== undefined)
        update.kind = patch.kind;
    if (patch.status !== undefined)
        update.status = patch.status;
    if (patch.teacherId !== undefined)
        update.teacher_id = patch.teacherId;
    if (patch.studentId !== undefined)
        update.student_id = patch.studentId;
    if (patch.familyId !== undefined)
        update.family_id = patch.familyId;
    if (patch.roomId !== undefined)
        update.room_id = patch.roomId;
    if (patch.locationId !== undefined)
        update.location_id = patch.locationId;
    if (patch.startTime !== undefined)
        update.start_time = patch.startTime;
    if (patch.endTime !== undefined)
        update.end_time = patch.endTime;
    if (patch.notes !== undefined)
        update.notes = patch.notes;
    if (patch.color !== undefined)
        update.color = patch.color;
    if (patch.recurrenceId !== undefined)
        update.recurrence_id = patch.recurrenceId;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .update(update)
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .select("*")
                .single();
            if (!error)
                return rowToEvent(data);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) {
        throw new Error(`lesson_event ${id} not found`);
    }
    const next = Object.assign(Object.assign({}, existing), update);
    store().set(id, next);
    return rowToEvent(next);
}
export async function deleteLessonEvent(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", id);
            if (!error)
                return;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const r = store().get(id);
    if (r && r.tenant_id === tenantId)
        store().delete(id);
}
export async function deleteLessonEventsByRecurrence(tenantId, recurrenceId, opts) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let q = supabase
                .from(TABLE)
                .delete({ count: "exact" })
                .eq("tenant_id", tenantId)
                .eq("recurrence_id", recurrenceId);
            if (opts === null || opts === void 0 ? void 0 : opts.fromTime)
                q = q.gte("start_time", opts.fromTime);
            const { error, count } = await q;
            if (!error)
                return count !== null && count !== void 0 ? count : 0;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    let removed = 0;
    for (const [id, r] of store().entries()) {
        if (r.tenant_id !== tenantId)
            continue;
        if (r.recurrence_id !== recurrenceId)
            continue;
        if ((opts === null || opts === void 0 ? void 0 : opts.fromTime) && r.start_time < opts.fromTime)
            continue;
        store().delete(id);
        removed += 1;
    }
    return removed;
}
