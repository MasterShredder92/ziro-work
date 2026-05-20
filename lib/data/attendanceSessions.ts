import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "attendance_sessions";

export type AttendanceSessionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type AttendanceSessionRow = {
  id: string;
  tenant_id: string;
  schedule_block_id: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  teacher_id: string | null;
  location_id: string | null;
  room_id: string | null;
  class_label: string | null;
  status: AttendanceSessionStatus;
  notes: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceSessionFilter = {
  schedule_block_id?: string;
  teacher_id?: string;
  location_id?: string;
  room_id?: string;
  status?: AttendanceSessionStatus;
  date_from?: string;
  date_to?: string;
  session_date?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_attendance_sessions_store?: Map<string, AttendanceSessionRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AttendanceSessionRow> {
  if (!g.__ziro_attendance_sessions_store)
    g.__ziro_attendance_sessions_store = new Map();
  return g.__ziro_attendance_sessions_store;
}

function inRange(row: AttendanceSessionRow, filter: AttendanceSessionFilter): boolean {
  if (filter.date_from && row.session_date < filter.date_from) return false;
  if (filter.date_to && row.session_date > filter.date_to) return false;
  return true;
}

export async function listAttendanceSessions(
  filter: AttendanceSessionFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AttendanceSessionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.schedule_block_id)
        query = query.eq("schedule_block_id", filter.schedule_block_id);
      if (filter.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
      if (filter.location_id) query = query.eq("location_id", filter.location_id);
      if (filter.room_id) query = query.eq("room_id", filter.room_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.session_date)
        query = query.eq("session_date", filter.session_date);
      if (filter.date_from) query = query.gte("session_date", filter.date_from);
      if (filter.date_to) query = query.lte("session_date", filter.date_to);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "session_date",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 1000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AttendanceSessionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) =>
      filter.schedule_block_id
        ? r.schedule_block_id === filter.schedule_block_id
        : true,
    )
    .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
    .filter((r) =>
      filter.location_id ? r.location_id === filter.location_id : true,
    )
    .filter((r) => (filter.room_id ? r.room_id === filter.room_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .filter((r) =>
      filter.session_date ? r.session_date === filter.session_date : true,
    )
    .filter((r) => inRange(r, filter))
    .sort((a, b) => b.session_date.localeCompare(a.session_date));
}

export async function getAttendanceSessionById(
  id: string,
  tenantId?: string,
): Promise<AttendanceSessionRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as AttendanceSessionRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(id) ?? null;
  if (row && tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export type UpsertAttendanceSessionInput = Partial<AttendanceSessionRow> & {
  tenant_id: string;
  session_date: string;
};

export async function upsertAttendanceSession(
  input: UpsertAttendanceSessionInput,
): Promise<AttendanceSessionRow> {
  const now = new Date().toISOString();
  const row: AttendanceSessionRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    schedule_block_id: input.schedule_block_id ?? null,
    session_date: input.session_date,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    teacher_id: input.teacher_id ?? null,
    location_id: input.location_id ?? null,
    room_id: input.room_id ?? null,
    class_label: input.class_label ?? null,
    status:
      (input.status as AttendanceSessionStatus | undefined) ?? "scheduled",
    notes: input.notes ?? null,
    closed_at: input.closed_at ?? null,
    closed_by: input.closed_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(input.tenant_id);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AttendanceSessionRow;
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}

export async function deleteAttendanceSession(
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

  const row = store().get(id);
  if (row && row.tenant_id === tenantId) store().delete(id);
}

/**
 * Find an existing attendance session for a given schedule_block_id + date.
 * Used to prevent duplicate sessions when auto-generating from Scheduling OS.
 */
export async function findSessionByBlockAndDate(
  tenantId: string,
  scheduleBlockId: string,
  sessionDate: string,
): Promise<AttendanceSessionRow | null> {
  const rows = await listAttendanceSessions(
    {
      schedule_block_id: scheduleBlockId,
      session_date: sessionDate,
    },
    tenantId,
    { limit: 1 },
  );
  return rows[0] ?? null;
}
