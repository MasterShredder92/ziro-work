/**
 * Schedule-OS friendly room facade.
 *
 * Wraps the legacy `rooms` data facade and exposes a typed surface that
 * matches the Scheduling & Calendar OS (ScheduleRoom). Falls back to an
 * in-memory store if the `rooms` table is not reachable.
 */
import { createRoom as createRoomRow, getRoomById as getRoomRow, listRooms as listRoomRows, updateRoom as updateRoomRow, } from "./rooms";
import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "rooms";
const g = globalThis;
function localStore() {
    if (!g.__ziro_schedule_rooms_store)
        g.__ziro_schedule_rooms_store = new Map();
    return g.__ziro_schedule_rooms_store;
}
function dbRowToRoom(tenantId, row) {
    var _a, _b, _c, _d, _e, _f;
    const equipment = Array.isArray(row.equipment)
        ? row.equipment
            .filter((v) => typeof v === "string")
        : [];
    const bookingRules = row.booking_rules && typeof row.booking_rules === "object"
        ? row.booking_rules
        : null;
    return {
        id: row.id,
        tenantId: (_a = row.tenant_id) !== null && _a !== void 0 ? _a : tenantId,
        locationId: (_b = row.location_id) !== null && _b !== void 0 ? _b : null,
        name: (_c = row.name) !== null && _c !== void 0 ? _c : "Room",
        capacity: Number.isFinite(row.capacity)
            ? row.capacity
            : 0,
        equipment,
        roomType: (_d = row.room_type) !== null && _d !== void 0 ? _d : null,
        bookingRules,
        isActive: row.is_active !== false,
        createdAt: (_e = row.created_at) !== null && _e !== void 0 ? _e : null,
        updatedAt: (_f = row.updated_at) !== null && _f !== void 0 ? _f : null,
    };
}
function localToRoom(r) {
    return {
        id: r.id,
        tenantId: r.tenant_id,
        locationId: r.location_id,
        name: r.name,
        capacity: r.capacity,
        equipment: r.equipment,
        roomType: r.room_type,
        bookingRules: r.booking_rules,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function toLocalRow(tenantId, input) {
    var _a, _b, _c;
    const now = new Date().toISOString();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `room_${Math.random().toString(36).slice(2, 10)}`,
        tenant_id: tenantId,
        location_id: input.locationId,
        name: input.name,
        capacity: input.capacity,
        equipment: input.equipment,
        room_type: (_b = input.roomType) !== null && _b !== void 0 ? _b : null,
        booking_rules: (_c = input.bookingRules) !== null && _c !== void 0 ? _c : null,
        is_active: input.isActive,
        created_at: now,
        updated_at: now,
    };
}
export async function listScheduleRooms(tenantId, filter) {
    if (!tableMissing(TABLE)) {
        try {
            const rows = await listRoomRows(tenantId, filter, { limit: 500 });
            return rows.map((r) => dbRowToRoom(tenantId, r));
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    return Array.from(localStore().values())
        .filter((r) => r.tenant_id === tenantId)
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(localToRoom);
}
export async function getScheduleRoom(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const row = await getRoomRow(id, tenantId);
            return row ? dbRowToRoom(tenantId, row) : null;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const r = localStore().get(id);
    if (!r || r.tenant_id !== tenantId)
        return null;
    return localToRoom(r);
}
export async function createScheduleRoom(tenantId, input) {
    const local = toLocalRow(tenantId, input);
    if (!tableMissing(TABLE)) {
        try {
            const row = await createRoomRow(tenantId, {
                id: local.id,
                location_id: local.location_id,
                name: local.name,
                capacity: local.capacity,
                is_active: local.is_active,
            });
            return dbRowToRoom(tenantId, row);
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    localStore().set(local.id, local);
    return localToRoom(local);
}
export async function updateScheduleRoom(id, tenantId, patch) {
    if (!tableMissing(TABLE)) {
        try {
            const row = await updateRoomRow(id, tenantId, Object.assign(Object.assign(Object.assign(Object.assign({}, (patch.name !== undefined ? { name: patch.name } : {})), (patch.locationId !== undefined
                ? { location_id: patch.locationId }
                : {})), (patch.capacity !== undefined
                ? { capacity: patch.capacity }
                : {})), (patch.isActive !== undefined
                ? { is_active: patch.isActive }
                : {})));
            return dbRowToRoom(tenantId, row);
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const now = new Date().toISOString();
    const existing = localStore().get(id);
    if (!existing || existing.tenant_id !== tenantId) {
        throw new Error(`room ${id} not found`);
    }
    const next = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, existing), (patch.name !== undefined ? { name: patch.name } : {})), (patch.locationId !== undefined ? { location_id: patch.locationId } : {})), (patch.capacity !== undefined ? { capacity: patch.capacity } : {})), (patch.equipment !== undefined ? { equipment: patch.equipment } : {})), (patch.roomType !== undefined ? { room_type: patch.roomType } : {})), (patch.bookingRules !== undefined
        ? { booking_rules: patch.bookingRules }
        : {})), (patch.isActive !== undefined ? { is_active: patch.isActive } : {})), { updated_at: now });
    localStore().set(id, next);
    return localToRoom(next);
}
export async function deleteScheduleRoom(id, tenantId) {
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
    const r = localStore().get(id);
    if (r && r.tenant_id === tenantId)
        localStore().delete(id);
}
