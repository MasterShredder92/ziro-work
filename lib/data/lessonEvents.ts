import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  LessonEvent,
  LessonEventInsert,
  LessonEventUpdate,
} from "@/lib/schedule/types";

const TABLE = "lesson_events";

export type LessonEventFilter = {
  teacher_id?: string;
  student_id?: string;
  family_id?: string;
  room_id?: string;
  location_id?: string;
  recurrence_id?: string;
  status?: string;
  kind?: string;
  start_from?: string;
  start_to?: string;
};

type Row = {
  id: string;
  tenant_id: string;
  recurrence_id: string | null;
  title: string;
  kind: string;
  status: string;
  teacher_id: string | null;
  student_id: string | null;
  family_id: string | null;
  room_id: string | null;
  location_id: string | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_events_store?: Map<string, Row>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, Row> {
  if (!g.__ziro_lesson_events_store)
    g.__ziro_lesson_events_store = new Map<string, Row>();
  return g.__ziro_lesson_events_store;
}

function rowToEvent(r: Row): LessonEvent {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    recurrenceId: r.recurrence_id,
    title: r.title,
    kind: r.kind as LessonEvent["kind"],
    status: r.status as LessonEvent["status"],
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

function eventToRow(
  tenantId: string,
  input: Omit<LessonEventInsert, "id"> & { id?: string },
): Row {
  const now = new Date().toISOString();
  const id = input.id ?? `evt_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    tenant_id: tenantId,
    recurrence_id: input.recurrenceId ?? null,
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
    notes: input.notes ?? null,
    color: input.color ?? null,
    created_by: input.createdBy ?? null,
    created_at: now,
    updated_at: now,
  };
}

function matches(r: Row, tenantId: string, filter?: LessonEventFilter): boolean {
  if (r.tenant_id !== tenantId) return false;
  if (filter?.teacher_id && r.teacher_id !== filter.teacher_id) return false;
  if (filter?.student_id && r.student_id !== filter.student_id) return false;
  if (filter?.family_id && r.family_id !== filter.family_id) return false;
  if (filter?.room_id && r.room_id !== filter.room_id) return false;
  if (filter?.location_id && r.location_id !== filter.location_id) return false;
  if (filter?.recurrence_id && r.recurrence_id !== filter.recurrence_id)
    return false;
  if (filter?.status && r.status !== filter.status) return false;
  if (filter?.kind && r.kind !== filter.kind) return false;
  if (filter?.start_from && r.start_time < filter.start_from) return false;
  if (filter?.start_to && r.start_time > filter.start_to) return false;
  return true;
}

export async function listLessonEvents(
  tenantId: string,
  filter?: LessonEventFilter,
  opts?: ListOptions,
): Promise<LessonEvent[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.teacher_id) q = q.eq("teacher_id", filter.teacher_id);
      if (filter?.student_id) q = q.eq("student_id", filter.student_id);
      if (filter?.family_id) q = q.eq("family_id", filter.family_id);
      if (filter?.room_id) q = q.eq("room_id", filter.room_id);
      if (filter?.location_id) q = q.eq("location_id", filter.location_id);
      if (filter?.recurrence_id)
        q = q.eq("recurrence_id", filter.recurrence_id);
      if (filter?.status) q = q.eq("status", filter.status);
      if (filter?.kind) q = q.eq("kind", filter.kind);
      if (filter?.start_from) q = q.gte("start_time", filter.start_from);
      if (filter?.start_to) q = q.lte("start_time", filter.start_to);
      const ordered = applyListOptions(q, {
        orderBy: opts?.orderBy ?? "start_time",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return ((data as Row[]) ?? []).map(rowToEvent);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const all = Array.from(store().values()).filter((r) =>
    matches(r, tenantId, filter),
  );
  all.sort((a, b) => (a.start_time < b.start_time ? -1 : 1));
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 500;
  return all.slice(offset, offset + limit).map(rowToEvent);
}

export async function getLessonEvent(
  id: string,
  tenantId: string,
): Promise<LessonEvent | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
      if (!error) return data ? rowToEvent(data as Row) : null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (!r || r.tenant_id !== tenantId) return null;
  return rowToEvent(r);
}

export async function createLessonEvent(
  tenantId: string,
  input: Omit<LessonEventInsert, "id"> & { id?: string },
): Promise<LessonEvent> {
  const row = eventToRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
      if (!error) return rowToEvent(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().set(row.id, row);
  return rowToEvent(row);
}

export async function updateLessonEvent(
  id: string,
  tenantId: string,
  patch: LessonEventUpdate,
): Promise<LessonEvent> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.kind !== undefined) update.kind = patch.kind;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.teacherId !== undefined) update.teacher_id = patch.teacherId;
  if (patch.studentId !== undefined) update.student_id = patch.studentId;
  if (patch.familyId !== undefined) update.family_id = patch.familyId;
  if (patch.roomId !== undefined) update.room_id = patch.roomId;
  if (patch.locationId !== undefined) update.location_id = patch.locationId;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.color !== undefined) update.color = patch.color;
  if (patch.recurrenceId !== undefined) update.recurrence_id = patch.recurrenceId;

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
      if (!error) return rowToEvent(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`lesson_event ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowToEvent(next);
}

export async function deleteLessonEvent(
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

export async function deleteLessonEventsByRecurrence(
  tenantId: string,
  recurrenceId: string,
  opts?: { fromTime?: string },
): Promise<number> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let q = supabase
        .from(TABLE)
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("recurrence_id", recurrenceId);
      if (opts?.fromTime) q = q.gte("start_time", opts.fromTime);
      const { error, count } = await q;
      if (!error) return count ?? 0;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  let removed = 0;
  for (const [id, r] of store().entries()) {
    if (r.tenant_id !== tenantId) continue;
    if (r.recurrence_id !== recurrenceId) continue;
    if (opts?.fromTime && r.start_time < opts.fromTime) continue;
    store().delete(id);
    removed += 1;
  }
  return removed;
}
