import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  TeacherAvailability,
  TeacherAvailabilityInsert,
  TeacherAvailabilityUpdate,
} from "@/lib/schedule/types";

const TABLE = "teacher_availability";

// DB day_of_week is a string ENUM: monday|tuesday|wednesday|thursday|friday|saturday|sunday
// The TeacherAvailability type uses dayOfWeek: number (0=Sun..6=Sat) — we bridge here.
const DAY_ENUM = [
  "sunday",    // 0
  "monday",    // 1
  "tuesday",   // 2
  "wednesday", // 3
  "thursday",  // 4
  "friday",    // 5
  "saturday",  // 6
] as const;
type DayEnum = typeof DAY_ENUM[number];
function intToDay(n: number): DayEnum { return DAY_ENUM[n] ?? "monday"; }
function dayToInt(d: string): number { const i = (DAY_ENUM as readonly string[]).indexOf(d); return i >= 0 ? i : 1; }

export type TeacherAvailabilityFilter = {
  teacher_id?: string;
  location_id?: string;
  day_of_week?: number; // integer 0-6
};

// Exact DB row shape — matches actual Supabase schema
type Row = {
  id: string;
  tenant_id: string;
  teacher_id: string;
  location_id: string;
  day_of_week: DayEnum;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Insert shape — id omitted so DB generates a proper UUID via uuid_generate_v4()
type InsertRow = Omit<Row, "id">;

type GlobalStore = typeof globalThis & {
  __ziro_teacher_availability_store?: Map<string, Row>;
};
const g = globalThis as GlobalStore;
function store(): Map<string, Row> {
  if (!g.__ziro_teacher_availability_store)
    g.__ziro_teacher_availability_store = new Map();
  return g.__ziro_teacher_availability_store;
}

function rowTo(r: Row): TeacherAvailability {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    teacherId: r.teacher_id,
    dayOfWeek: dayToInt(r.day_of_week),
    startTime: r.start_time,
    endTime: r.end_time,
    // DB has no effectiveFrom/effectiveUntil — use notes to carry locationId for consumers
    effectiveFrom: null,
    effectiveUntil: null,
    notes: r.location_id, // locationId piggybacked into notes field
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Returns an InsertRow (no id) — DB generates the UUID via DEFAULT uuid_generate_v4()
function toInsertRow(tenantId: string, input: TeacherAvailabilityInsert & { locationId?: string }): InsertRow {
  const now = new Date().toISOString();
  // locationId may come directly or piggybacked in notes
  const locationId = (input as { locationId?: string }).locationId ?? input.notes ?? "";
  return {
    tenant_id: tenantId,
    teacher_id: input.teacherId,
    location_id: locationId,
    day_of_week: intToDay(input.dayOfWeek),
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export async function listTeacherAvailability(
  tenantId: string,
  filter?: TeacherAvailabilityFilter,
  opts?: ListOptions,
): Promise<TeacherAvailability[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.teacher_id) q = q.eq("teacher_id", filter.teacher_id);
      if (filter?.location_id) q = q.eq("location_id", filter.location_id);
      if (typeof filter?.day_of_week === "number")
        q = q.eq("day_of_week", intToDay(filter.day_of_week));
      const ordered = applyListOptions(q, {
        orderBy: opts?.orderBy ?? "day_of_week",
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
      if (filter?.teacher_id && r.teacher_id !== filter.teacher_id) return false;
      if (filter?.location_id && r.location_id !== filter.location_id) return false;
      if (
        typeof filter?.day_of_week === "number" &&
        r.day_of_week !== intToDay(filter.day_of_week)
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        (DAY_ENUM as readonly string[]).indexOf(a.day_of_week) - (DAY_ENUM as readonly string[]).indexOf(b.day_of_week) ||
        (a.start_time < b.start_time ? -1 : 1),
    )
    .map(rowTo);
}

export async function getTeacherAvailabilityById(
  id: string,
  tenantId: string,
): Promise<TeacherAvailability | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
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

export async function createTeacherAvailability(
  tenantId: string,
  input: TeacherAvailabilityInsert & { locationId?: string },
): Promise<TeacherAvailability> {
  const insertRow = toInsertRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(insertRow)  // no id field — DB generates UUID
        .select("*")
        .single();
      if (!error) return rowTo(data as Row);
      // Log the exact Supabase error for debugging
      console.error("[teacher_availability] INSERT error:", JSON.stringify(error));
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      console.error("[teacher_availability] INSERT catch:", err);
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  // In-memory fallback — use crypto.randomUUID for a valid UUID
  const fallbackRow: Row = { ...insertRow, id: crypto.randomUUID() };
  store().set(fallbackRow.id, fallbackRow);
  return rowTo(fallbackRow);
}

export async function updateTeacherAvailability(
  id: string,
  tenantId: string,
  patch: TeacherAvailabilityUpdate,
): Promise<TeacherAvailability> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.teacherId !== undefined) update.teacher_id = patch.teacherId;
  if (patch.dayOfWeek !== undefined) update.day_of_week = intToDay(patch.dayOfWeek);
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  // notes field carries locationId for our consumers
  if (patch.notes !== undefined) update.location_id = patch.notes;

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .update(update)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (!error) return rowTo(data as Row);
      console.error("[teacher_availability] UPDATE error:", JSON.stringify(error));
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      console.error("[teacher_availability] UPDATE catch:", err);
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`teacher_availability ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowTo(next);
}

/**
 * Replace All: atomically delete all rows for a teacher+location pair, then bulk-insert fresh slots.
 * This is the correct write pattern — prevents duplicate stacking.
 */
export async function replaceTeacherAvailabilityForLocation(
  tenantId: string,
  teacherId: string,
  locationId: string,
  slots: Array<TeacherAvailabilityInsert & { locationId?: string }>,
): Promise<TeacherAvailability[]> {
  const supabase = await clientFor(tenantId);

  // Step A: DELETE all existing rows for this teacher+location
  const { error: delError } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("teacher_id", teacherId)
    .eq("location_id", locationId);

  if (delError) {
    console.error("[teacher_availability] REPLACE DELETE error:", JSON.stringify(delError));
    throw delError;
  }

  // Step B: INSERT fresh slots (empty array = clear all, which is valid)
  if (slots.length === 0) return [];

  const insertRows = slots.map((s) => toInsertRow(tenantId, { ...s, locationId }));
  const { data, error: insError } = await supabase
    .from(TABLE)
    .insert(insertRows)
    .select("*");

  if (insError) {
    console.error("[teacher_availability] REPLACE INSERT error:", JSON.stringify(insError));
    throw insError;
  }

  console.log(
    `[teacher_availability] REPLACE: deleted all for teacher=${teacherId} location=${locationId}, inserted ${insertRows.length} rows`,
  );

  return ((data as Row[]) ?? []).map(rowTo);
}

export async function deleteTeacherAvailability(
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
      console.error("[teacher_availability] DELETE error:", JSON.stringify(error));
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      console.error("[teacher_availability] DELETE catch:", err);
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (r && r.tenant_id === tenantId) store().delete(id);
}
