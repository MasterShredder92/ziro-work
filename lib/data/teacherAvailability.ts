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

export type TeacherAvailabilityFilter = {
  teacher_id?: string;
  day_of_week?: number;
};

type Row = {
  id: string;
  tenant_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string | null;
  effective_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

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

function toRow(tenantId: string, input: TeacherAvailabilityInsert): Row {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `avl_${Math.random().toString(36).slice(2, 10)}`,
    tenant_id: tenantId,
    teacher_id: input.teacherId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    effective_from: input.effectiveFrom ?? null,
    effective_until: input.effectiveUntil ?? null,
    notes: input.notes ?? null,
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
      const supabase = clientFor(tenantId);
      let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.teacher_id) q = q.eq("teacher_id", filter.teacher_id);
      if (typeof filter?.day_of_week === "number")
        q = q.eq("day_of_week", filter.day_of_week);
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
      if (
        typeof filter?.day_of_week === "number" &&
        r.day_of_week !== filter.day_of_week
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        a.day_of_week - b.day_of_week ||
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

export async function createTeacherAvailability(
  tenantId: string,
  input: TeacherAvailabilityInsert,
): Promise<TeacherAvailability> {
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

export async function updateTeacherAvailability(
  id: string,
  tenantId: string,
  patch: TeacherAvailabilityUpdate,
): Promise<TeacherAvailability> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.teacherId !== undefined) update.teacher_id = patch.teacherId;
  if (patch.dayOfWeek !== undefined) update.day_of_week = patch.dayOfWeek;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  if (patch.effectiveFrom !== undefined)
    update.effective_from = patch.effectiveFrom;
  if (patch.effectiveUntil !== undefined)
    update.effective_until = patch.effectiveUntil;
  if (patch.notes !== undefined) update.notes = patch.notes;

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
    throw new Error(`teacher_availability ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowTo(next);
}

export async function deleteTeacherAvailability(
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
