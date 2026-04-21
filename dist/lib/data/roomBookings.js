import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "room_bookings";
const g = globalThis;
function store() {
    if (!g.__ziro_room_bookings_store)
        g.__ziro_room_bookings_store = new Map();
    return g.__ziro_room_bookings_store;
}
function rowTo(r) {
    return {
        id: r.id,
        tenantId: r.tenant_id,
        roomId: r.room_id,
        eventId: r.event_id,
        startTime: r.start_time,
        endTime: r.end_time,
        bookedBy: r.booked_by,
        purpose: r.purpose,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function toRow(tenantId, input) {
    var _a, _b, _c, _d;
    const now = new Date().toISOString();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `bk_${Math.random().toString(36).slice(2, 10)}`,
        tenant_id: tenantId,
        room_id: input.roomId,
        event_id: (_b = input.eventId) !== null && _b !== void 0 ? _b : null,
        start_time: input.startTime,
        end_time: input.endTime,
        booked_by: (_c = input.bookedBy) !== null && _c !== void 0 ? _c : null,
        purpose: (_d = input.purpose) !== null && _d !== void 0 ? _d : null,
        created_at: now,
        updated_at: now,
    };
}
export async function listRoomBookings(tenantId, filter, opts) {
    var _a, _b, _c, _d;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.room_id)
                q = q.eq("room_id", filter.room_id);
            if (filter === null || filter === void 0 ? void 0 : filter.event_id)
                q = q.eq("event_id", filter.event_id);
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
        if ((filter === null || filter === void 0 ? void 0 : filter.room_id) && r.room_id !== filter.room_id)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.event_id) && r.event_id !== filter.event_id)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.start_from) && r.start_time < filter.start_from)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.start_to) && r.start_time > filter.start_to)
            return false;
        return true;
    })
        .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
        .map(rowTo);
}
export async function getRoomBooking(id, tenantId) {
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
export async function createRoomBooking(tenantId, input) {
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
export async function updateRoomBooking(id, tenantId, patch) {
    const now = new Date().toISOString();
    const update = { updated_at: now };
    if (patch.roomId !== undefined)
        update.room_id = patch.roomId;
    if (patch.eventId !== undefined)
        update.event_id = patch.eventId;
    if (patch.startTime !== undefined)
        update.start_time = patch.startTime;
    if (patch.endTime !== undefined)
        update.end_time = patch.endTime;
    if (patch.bookedBy !== undefined)
        update.booked_by = patch.bookedBy;
    if (patch.purpose !== undefined)
        update.purpose = patch.purpose;
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
        throw new Error(`room_booking ${id} not found`);
    }
    const next = Object.assign(Object.assign({}, existing), update);
    store().set(id, next);
    return rowTo(next);
}
export async function deleteRoomBooking(id, tenantId) {
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
