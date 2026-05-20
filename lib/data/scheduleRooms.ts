/**
 * Schedule-OS friendly room facade.
 *
 * Wraps the legacy `rooms` data facade and exposes a typed surface that
 * matches the Scheduling & Calendar OS (ScheduleRoom). Falls back to an
 * in-memory store if the `rooms` table is not reachable.
 */

import {
  createRoom as createRoomRow,
  getRoomById as getRoomRow,
  listRooms as listRoomRows,
  updateRoom as updateRoomRow,
  type RoomFilter,
} from "./rooms";
import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  ScheduleRoom,
  ScheduleRoomInsert,
  ScheduleRoomUpdate,
} from "@/lib/schedule/types";
import type { Room } from "@/lib/types/entities";

const TABLE = "rooms";

type AnyRoom = Room & Record<string, unknown>;

type LocalRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  name: string;
  capacity: number;
  equipment: string[];
  room_type: string | null;
  booking_rules: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_schedule_rooms_store?: Map<string, LocalRow>;
};
const g = globalThis as GlobalStore;
function localStore(): Map<string, LocalRow> {
  if (!g.__ziro_schedule_rooms_store)
    g.__ziro_schedule_rooms_store = new Map();
  return g.__ziro_schedule_rooms_store;
}

function dbRowToRoom(tenantId: string, row: AnyRoom): ScheduleRoom {
  const equipment = Array.isArray(row.equipment)
    ? (row.equipment as unknown[])
        .filter((v): v is string => typeof v === "string")
    : [];
  const bookingRules =
    row.booking_rules && typeof row.booking_rules === "object"
      ? (row.booking_rules as Record<string, unknown>)
      : null;
  return {
    id: row.id,
    tenantId: row.tenant_id ?? tenantId,
    locationId: (row.location_id as string | null | undefined) ?? null,
    name: (row.name as string | null | undefined) ?? "Room",
    capacity: Number.isFinite(row.capacity as number)
      ? (row.capacity as number)
      : 0,
    equipment,
    roomType: (row.room_type as string | null | undefined) ?? null,
    bookingRules,
    isActive: row.is_active !== false,
    displayOrder: (row.display_order as number | null | undefined) ?? null,
    primaryInstruments: Array.isArray(row.primary_instruments)
      ? (row.primary_instruments as unknown[]).filter((v): v is string => typeof v === 'string')
      : null,
    floor: (row.floor as number | null | undefined) ?? null,
    color: (row.color as string | null | undefined) ?? null,
    createdAt: (row.created_at as string | null | undefined) ?? null,
    updatedAt: (row.updated_at as string | null | undefined) ?? null,
  };
}

function localToRoom(r: LocalRow): ScheduleRoom {
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

function toLocalRow(tenantId: string, input: ScheduleRoomInsert): LocalRow {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `room_${Math.random().toString(36).slice(2, 10)}`,
    tenant_id: tenantId,
    location_id: input.locationId,
    name: input.name,
    capacity: input.capacity,
    equipment: input.equipment,
    room_type: input.roomType ?? null,
    booking_rules: input.bookingRules ?? null,
    is_active: input.isActive,
    created_at: now,
    updated_at: now,
  };
}

export type ScheduleRoomFilter = RoomFilter;

export async function listScheduleRooms(
  tenantId: string,
  filter?: ScheduleRoomFilter,
): Promise<ScheduleRoom[]> {
  if (!tableMissing(TABLE)) {
    try {
      const rows = await listRoomRows(tenantId, filter, { limit: 500 });
      return rows.map((r) => dbRowToRoom(tenantId, r as AnyRoom));
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(localStore().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map(localToRoom);
}

export async function getScheduleRoom(
  id: string,
  tenantId: string,
): Promise<ScheduleRoom | null> {
  if (!tableMissing(TABLE)) {
    try {
      const row = await getRoomRow(id, tenantId);
      return row ? dbRowToRoom(tenantId, row as AnyRoom) : null;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = localStore().get(id);
  if (!r || r.tenant_id !== tenantId) return null;
  return localToRoom(r);
}

export async function createScheduleRoom(
  tenantId: string,
  input: ScheduleRoomInsert,
): Promise<ScheduleRoom> {
  const local = toLocalRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const row = await createRoomRow(tenantId, {
        id: local.id,
        location_id: local.location_id,
        name: local.name,
        capacity: local.capacity,
        is_active: local.is_active,
      } as unknown as Parameters<typeof createRoomRow>[1]);
      return dbRowToRoom(tenantId, row as AnyRoom);
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  localStore().set(local.id, local);
  return localToRoom(local);
}

export async function updateScheduleRoom(
  id: string,
  tenantId: string,
  patch: ScheduleRoomUpdate,
): Promise<ScheduleRoom> {
  if (!tableMissing(TABLE)) {
    try {
      const row = await updateRoomRow(id, tenantId, {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.locationId !== undefined
          ? { location_id: patch.locationId }
          : {}),
        ...(patch.capacity !== undefined
          ? { capacity: patch.capacity }
          : {}),
        ...(patch.isActive !== undefined
          ? { is_active: patch.isActive }
          : {}),
      } as unknown as Parameters<typeof updateRoomRow>[2]);
      return dbRowToRoom(tenantId, row as AnyRoom);
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const now = new Date().toISOString();
  const existing = localStore().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`room ${id} not found`);
  }
  const next: LocalRow = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.locationId !== undefined ? { location_id: patch.locationId } : {}),
    ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
    ...(patch.equipment !== undefined ? { equipment: patch.equipment } : {}),
    ...(patch.roomType !== undefined ? { room_type: patch.roomType } : {}),
    ...(patch.bookingRules !== undefined
      ? { booking_rules: patch.bookingRules }
      : {}),
    ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
    updated_at: now,
  };
  localStore().set(id, next);
  return localToRoom(next);
}

export async function deleteScheduleRoom(
  id: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = localStore().get(id);
  if (r && r.tenant_id === tenantId) localStore().delete(id);
}
