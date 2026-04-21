import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "attendance_sessions";
const g = globalThis;
function store() {
    if (!g.__ziro_attendance_sessions_store)
        g.__ziro_attendance_sessions_store = new Map();
    return g.__ziro_attendance_sessions_store;
}
function inRange(row, filter) {
    if (filter.date_from && row.session_date < filter.date_from)
        return false;
    if (filter.date_to && row.session_date > filter.date_to)
        return false;
    return true;
}
export async function listAttendanceSessions(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.schedule_block_id)
                query = query.eq("schedule_block_id", filter.schedule_block_id);
            if (filter.teacher_id)
                query = query.eq("teacher_id", filter.teacher_id);
            if (filter.location_id)
                query = query.eq("location_id", filter.location_id);
            if (filter.room_id)
                query = query.eq("room_id", filter.room_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            if (filter.session_date)
                query = query.eq("session_date", filter.session_date);
            if (filter.date_from)
                query = query.gte("session_date", filter.date_from);
            if (filter.date_to)
                query = query.lte("session_date", filter.date_to);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "session_date",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 1000,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
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
    return Array.from(store().values())
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .filter((r) => filter.schedule_block_id
        ? r.schedule_block_id === filter.schedule_block_id
        : true)
        .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
        .filter((r) => filter.location_id ? r.location_id === filter.location_id : true)
        .filter((r) => (filter.room_id ? r.room_id === filter.room_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .filter((r) => filter.session_date ? r.session_date === filter.session_date : true)
        .filter((r) => inRange(r, filter))
        .sort((a, b) => b.session_date.localeCompare(a.session_date));
}
export async function getAttendanceSessionById(id, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", id);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { data, error } = await query.maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
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
    const row = (_a = store().get(id)) !== null && _a !== void 0 ? _a : null;
    if (row && tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAttendanceSession(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        schedule_block_id: (_b = input.schedule_block_id) !== null && _b !== void 0 ? _b : null,
        session_date: input.session_date,
        start_time: (_c = input.start_time) !== null && _c !== void 0 ? _c : null,
        end_time: (_d = input.end_time) !== null && _d !== void 0 ? _d : null,
        teacher_id: (_e = input.teacher_id) !== null && _e !== void 0 ? _e : null,
        location_id: (_f = input.location_id) !== null && _f !== void 0 ? _f : null,
        room_id: (_g = input.room_id) !== null && _g !== void 0 ? _g : null,
        class_label: (_h = input.class_label) !== null && _h !== void 0 ? _h : null,
        status: (_j = input.status) !== null && _j !== void 0 ? _j : "scheduled",
        notes: (_k = input.notes) !== null && _k !== void 0 ? _k : null,
        closed_at: (_l = input.closed_at) !== null && _l !== void 0 ? _l : null,
        closed_by: (_m = input.closed_by) !== null && _m !== void 0 ? _m : null,
        created_at: (_o = input.created_at) !== null && _o !== void 0 ? _o : now,
        updated_at: now,
    };
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(input.tenant_id);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else if (error)
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
    return row;
}
export async function deleteAttendanceSession(id, tenantId) {
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
    const row = store().get(id);
    if (row && row.tenant_id === tenantId)
        store().delete(id);
}
/**
 * Find an existing attendance session for a given schedule_block_id + date.
 * Used to prevent duplicate sessions when auto-generating from Scheduling OS.
 */
export async function findSessionByBlockAndDate(tenantId, scheduleBlockId, sessionDate) {
    var _a;
    const rows = await listAttendanceSessions({
        schedule_block_id: scheduleBlockId,
        session_date: sessionDate,
    }, tenantId, { limit: 1 });
    return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
}
