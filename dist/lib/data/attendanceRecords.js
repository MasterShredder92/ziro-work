import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "attendance_records";
const g = globalThis;
function store() {
    if (!g.__ziro_attendance_records_store)
        g.__ziro_attendance_records_store = new Map();
    return g.__ziro_attendance_records_store;
}
/**
 * The `date_from`/`date_to` filter is applied against created_at since attendance_records
 * themselves don't carry a date field — the session does. Queries that need to filter by
 * the session's date should first resolve a set of session IDs and use `session_id`.
 */
export async function listAttendanceRecords(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.session_id)
                query = query.eq("session_id", filter.session_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.teacher_id)
                query = query.eq("teacher_id", filter.teacher_id);
            if (filter.schedule_block_id)
                query = query.eq("schedule_block_id", filter.schedule_block_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            if (filter.date_from)
                query = query.gte("created_at", filter.date_from);
            if (filter.date_to)
                query = query.lte("created_at", filter.date_to);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 2000,
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
        .filter((r) => (filter.session_id ? r.session_id === filter.session_id : true))
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
        .filter((r) => filter.schedule_block_id
        ? r.schedule_block_id === filter.schedule_block_id
        : true)
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .filter((r) => filter.date_from ? r.created_at >= filter.date_from : true)
        .filter((r) => (filter.date_to ? r.created_at <= filter.date_to : true))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function getAttendanceRecordById(id, tenantId) {
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
export async function upsertAttendanceRecord(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        session_id: input.session_id,
        student_id: input.student_id,
        schedule_block_id: (_b = input.schedule_block_id) !== null && _b !== void 0 ? _b : null,
        teacher_id: (_c = input.teacher_id) !== null && _c !== void 0 ? _c : null,
        status: input.status,
        arrived_at: (_d = input.arrived_at) !== null && _d !== void 0 ? _d : null,
        left_at: (_e = input.left_at) !== null && _e !== void 0 ? _e : null,
        minutes_late: (_f = input.minutes_late) !== null && _f !== void 0 ? _f : null,
        reason_id: (_g = input.reason_id) !== null && _g !== void 0 ? _g : null,
        reason_text: (_h = input.reason_text) !== null && _h !== void 0 ? _h : null,
        is_excused: (_j = input.is_excused) !== null && _j !== void 0 ? _j : input.status === "excused",
        marked_by: (_k = input.marked_by) !== null && _k !== void 0 ? _k : null,
        marked_at: (_l = input.marked_at) !== null && _l !== void 0 ? _l : now,
        override_of: (_m = input.override_of) !== null && _m !== void 0 ? _m : null,
        override_reason: (_o = input.override_reason) !== null && _o !== void 0 ? _o : null,
        notes: (_p = input.notes) !== null && _p !== void 0 ? _p : null,
        created_at: (_q = input.created_at) !== null && _q !== void 0 ? _q : now,
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
export async function deleteAttendanceRecord(id, tenantId) {
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
 * Find the most recent (non-overridden) record for a given student within a session.
 * Returns `null` if none.
 */
export async function findRecordForStudentInSession(tenantId, sessionId, studentId) {
    var _a;
    const rows = await listAttendanceRecords({ session_id: sessionId, student_id: studentId }, tenantId, { limit: 50, orderBy: "created_at", ascending: false });
    const active = rows.find((r) => !rows.some((o) => o.override_of === r.id));
    return (_a = active !== null && active !== void 0 ? active : rows[0]) !== null && _a !== void 0 ? _a : null;
}
