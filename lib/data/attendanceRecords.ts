import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "attendance_records";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "tardy"
  | "excused"
  | "makeup"
  | "no_show";

export type AttendanceRecordRow = {
  id: string;
  tenant_id: string;
  session_id: string;
  student_id: string;
  schedule_block_id: string | null;
  teacher_id: string | null;
  status: AttendanceStatus;
  arrived_at: string | null;
  left_at: string | null;
  minutes_late: number | null;
  reason_id: string | null;
  reason_text: string | null;
  is_excused: boolean;
  marked_by: string | null;
  marked_at: string | null;
  override_of: string | null;
  override_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecordFilter = {
  session_id?: string;
  student_id?: string;
  teacher_id?: string;
  schedule_block_id?: string;
  status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_attendance_records_store?: Map<string, AttendanceRecordRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AttendanceRecordRow> {
  if (!g.__ziro_attendance_records_store)
    g.__ziro_attendance_records_store = new Map();
  return g.__ziro_attendance_records_store;
}

/**
 * The `date_from`/`date_to` filter is applied against created_at since attendance_records
 * themselves don't carry a date field — the session does. Queries that need to filter by
 * the session's date should first resolve a set of session IDs and use `session_id`.
 */
export async function listAttendanceRecords(
  filter: AttendanceRecordFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AttendanceRecordRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.session_id) query = query.eq("session_id", filter.session_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
      if (filter.schedule_block_id)
        query = query.eq("schedule_block_id", filter.schedule_block_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "created_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 2000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AttendanceRecordRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.session_id ? r.session_id === filter.session_id : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
    .filter((r) =>
      filter.schedule_block_id
        ? r.schedule_block_id === filter.schedule_block_id
        : true,
    )
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .filter((r) =>
      filter.date_from ? r.created_at >= filter.date_from : true,
    )
    .filter((r) => (filter.date_to ? r.created_at <= filter.date_to : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAttendanceRecordById(
  id: string,
  tenantId?: string,
): Promise<AttendanceRecordRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as AttendanceRecordRow | null;
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

export type UpsertAttendanceRecordInput = Partial<AttendanceRecordRow> & {
  tenant_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
};

export async function upsertAttendanceRecord(
  input: UpsertAttendanceRecordInput,
): Promise<AttendanceRecordRow> {
  const now = new Date().toISOString();
  const row: AttendanceRecordRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    session_id: input.session_id,
    student_id: input.student_id,
    schedule_block_id: input.schedule_block_id ?? null,
    teacher_id: input.teacher_id ?? null,
    status: input.status,
    arrived_at: input.arrived_at ?? null,
    left_at: input.left_at ?? null,
    minutes_late: input.minutes_late ?? null,
    reason_id: input.reason_id ?? null,
    reason_text: input.reason_text ?? null,
    is_excused: input.is_excused ?? input.status === "excused",
    marked_by: input.marked_by ?? null,
    marked_at: input.marked_at ?? now,
    override_of: input.override_of ?? null,
    override_reason: input.override_reason ?? null,
    notes: input.notes ?? null,
    created_at: input.created_at ?? now,
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
      if (!error && data) return data as AttendanceRecordRow;
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

export async function deleteAttendanceRecord(
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

  const row = store().get(id);
  if (row && row.tenant_id === tenantId) store().delete(id);
}

/**
 * Find the most recent (non-overridden) record for a given student within a session.
 * Returns `null` if none.
 */
export async function findRecordForStudentInSession(
  tenantId: string,
  sessionId: string,
  studentId: string,
): Promise<AttendanceRecordRow | null> {
  const rows = await listAttendanceRecords(
    { session_id: sessionId, student_id: studentId },
    tenantId,
    { limit: 50, orderBy: "created_at", ascending: false },
  );
  const active = rows.find((r) => !rows.some((o) => o.override_of === r.id));
  return active ?? rows[0] ?? null;
}
