import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "teacher_availability";
const g = globalThis;
function store() {
    if (!g.__ziro_teacher_availability_store)
        g.__ziro_teacher_availability_store = new Map();
    return g.__ziro_teacher_availability_store;
}
function rowTo(r) {
    return {
        id: r.id,
        tenantId: r.tenant_id,
        teacherId: r.teacher_id,
        dayOfWeek: r.day_of_week,
        startTime: r.start_time,
        endTime: r.end_time,
        effectiveFrom: r.effective_from,
        effectiveUntil: r.effective_until,
        notes: r.notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function toRow(tenantId, input) {
    var _a, _b, _c, _d;
    const now = new Date().toISOString();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `avl_${Math.random().toString(36).slice(2, 10)}`,
        tenant_id: tenantId,
        teacher_id: input.teacherId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        effective_from: (_b = input.effectiveFrom) !== null && _b !== void 0 ? _b : null,
        effective_until: (_c = input.effectiveUntil) !== null && _c !== void 0 ? _c : null,
        notes: (_d = input.notes) !== null && _d !== void 0 ? _d : null,
        created_at: now,
        updated_at: now,
    };
}
export async function listTeacherAvailability(tenantId, filter, opts) {
    var _a, _b, _c, _d;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
                q = q.eq("teacher_id", filter.teacher_id);
            if (typeof (filter === null || filter === void 0 ? void 0 : filter.day_of_week) === "number")
                q = q.eq("day_of_week", filter.day_of_week);
            const ordered = applyListOptions(q, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "day_of_week",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return ((_d = data) !== null && _d !== void 0 ? _d : []).map(rowTo);
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
        .filter((r) => {
        if (r.tenant_id !== tenantId)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.teacher_id) && r.teacher_id !== filter.teacher_id)
            return false;
        if (typeof (filter === null || filter === void 0 ? void 0 : filter.day_of_week) === "number" &&
            r.day_of_week !== filter.day_of_week)
            return false;
        return true;
    })
        .sort((a, b) => a.day_of_week - b.day_of_week ||
        (a.start_time < b.start_time ? -1 : 1))
        .map(rowTo);
}
export async function getTeacherAvailabilityById(id, tenantId) {
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
                return data ? rowTo(data) : null;
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
    return rowTo(r);
}
export async function createTeacherAvailability(tenantId, input) {
    const row = toRow(tenantId, input);
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .insert(row)
                .select("*")
                .single();
            if (!error)
                return rowTo(data);
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
    return rowTo(row);
}
export async function updateTeacherAvailability(id, tenantId, patch) {
    const now = new Date().toISOString();
    const update = { updated_at: now };
    if (patch.teacherId !== undefined)
        update.teacher_id = patch.teacherId;
    if (patch.dayOfWeek !== undefined)
        update.day_of_week = patch.dayOfWeek;
    if (patch.startTime !== undefined)
        update.start_time = patch.startTime;
    if (patch.endTime !== undefined)
        update.end_time = patch.endTime;
    if (patch.effectiveFrom !== undefined)
        update.effective_from = patch.effectiveFrom;
    if (patch.effectiveUntil !== undefined)
        update.effective_until = patch.effectiveUntil;
    if (patch.notes !== undefined)
        update.notes = patch.notes;
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
                return rowTo(data);
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
        throw new Error(`teacher_availability ${id} not found`);
    }
    const next = Object.assign(Object.assign({}, existing), update);
    store().set(id, next);
    return rowTo(next);
}
export async function deleteTeacherAvailability(id, tenantId) {
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
