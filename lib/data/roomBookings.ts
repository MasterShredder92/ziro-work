import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  RoomBooking,
  RoomBookingInsert,
  RoomBookingUpdate,
} from "@/lib/schedule/types";

const TABLE = "room_bookings";

export type RoomBookingFilter = {
  room_id?: string;
  event_id?: string;
  start_from?: string;
  start_to?: string;
};

type Row = {
  id: string;
  tenant_id: string;
  room_id: string;
  event_id: string | null;
  start_time: string;
  end_time: string;
  booked_by: string | null;
  purpose: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_room_bookings_store?: Map<string, Row>;
};
const g = globalThis as GlobalStore;
function store(): Map<string, Row> {
  if (!g.__ziro_room_bookings_store)
    g.__ziro_room_bookings_store = new Map();
  return g.__ziro_room_bookings_store;
}

function rowTo(r: Row): RoomBooking {
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

function toRow(tenantId: string, input: RoomBookingInsert): Row {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `bk_${Math.random().toString(36).slice(2, 10)}`,
    tenant_id: tenantId,
    room_id: input.roomId,
    event_id: input.eventId ?? null,
    start_time: input.startTime,
    end_time: input.endTime,
    booked_by: input.bookedBy ?? null,
    purpose: input.purpose ?? null,
    created_at: now,
    updated_at: now,
  };
}

export async function listRoomBookings(
  tenantId: string,
  filter?: RoomBookingFilter,
  opts?: ListOptions,
): Promise<RoomBooking[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.room_id) q = q.eq("room_id", filter.room_id);
      if (filter?.event_id) q = q.eq("event_id", filter.event_id);
      if (filter?.start_from) q = q.gte("start_time", filter.start_from);
      if (filter?.start_to) q = q.lte("start_time", filter.start_to);
      const ordered = applyListOptions(q, {
        orderBy: opts?.orderBy ?? "start_time",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return ((data as Row[]) ?? []).map(rowTo);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => {
      if (r.tenant_id !== tenantId) return false;
      if (filter?.room_id && r.room_id !== filter.room_id) return false;
      if (filter?.event_id && r.event_id !== filter.event_id) return false;
      if (filter?.start_from && r.start_time < filter.start_from) return false;
      if (filter?.start_to && r.start_time > filter.start_to) return false;
      return true;
    })
    .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
    .map(rowTo);
}

export async function getRoomBooking(
  id: string,
  tenantId: string,
): Promise<RoomBooking | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
      if (!error) return data ? rowTo(data as Row) : null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (!r || r.tenant_id !== tenantId) return null;
  return rowTo(r);
}

export async function createRoomBooking(
  tenantId: string,
  input: RoomBookingInsert,
): Promise<RoomBooking> {
  const row = toRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
      if (!error) return rowTo(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().set(row.id, row);
  return rowTo(row);
}

export async function updateRoomBooking(
  id: string,
  tenantId: string,
  patch: RoomBookingUpdate,
): Promise<RoomBooking> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.roomId !== undefined) update.room_id = patch.roomId;
  if (patch.eventId !== undefined) update.event_id = patch.eventId;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  if (patch.bookedBy !== undefined) update.booked_by = patch.bookedBy;
  if (patch.purpose !== undefined) update.purpose = patch.purpose;

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
      if (!error) return rowTo(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`room_booking ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowTo(next);
}

export async function deleteRoomBooking(
  id: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
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
  const r = store().get(id);
  if (r && r.tenant_id === tenantId) store().delete(id);
}
