import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "attendance_reasons";

export type AttendanceReasonCategory =
  | "illness"
  | "family"
  | "travel"
  | "school"
  | "weather"
  | "makeup"
  | "other";

export type AttendanceReasonRow = {
  id: string;
  tenant_id: string;
  code: string;
  label: string;
  category: AttendanceReasonCategory;
  is_excused: boolean;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceReasonFilter = {
  category?: AttendanceReasonCategory;
  is_active?: boolean;
};

type GlobalStore = typeof globalThis & {
  __ziro_attendance_reasons_store?: Map<string, AttendanceReasonRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AttendanceReasonRow> {
  if (!g.__ziro_attendance_reasons_store) {
    g.__ziro_attendance_reasons_store = new Map();
  }
  return g.__ziro_attendance_reasons_store;
}

export async function listAttendanceReasons(
  filter: AttendanceReasonFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AttendanceReasonRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.category) query = query.eq("category", filter.category);
      if (typeof filter.is_active === "boolean")
        query = query.eq("is_active", filter.is_active);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AttendanceReasonRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.category ? r.category === filter.category : true))
    .filter((r) =>
      typeof filter.is_active === "boolean"
        ? r.is_active === filter.is_active
        : true,
    )
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.label.localeCompare(b.label),
    );
}

export async function getAttendanceReasonById(
  id: string,
  tenantId?: string,
): Promise<AttendanceReasonRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as AttendanceReasonRow | null;
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

export type UpsertAttendanceReasonInput = Partial<AttendanceReasonRow> & {
  tenant_id: string;
  code: string;
  label: string;
};

export async function upsertAttendanceReason(
  input: UpsertAttendanceReasonInput,
): Promise<AttendanceReasonRow> {
  const now = new Date().toISOString();
  const row: AttendanceReasonRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    code: input.code,
    label: input.label,
    category:
      (input.category as AttendanceReasonCategory | undefined) ?? "other",
    is_excused: input.is_excused ?? false,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
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
      if (!error && data) return data as AttendanceReasonRow;
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

export async function deleteAttendanceReason(
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
 * Returns a built-in set of reasons (used as a fallback when the workspace has no
 * customized entries yet). Always tenant-scoped, not persisted.
 */
export function defaultAttendanceReasons(tenantId: string): AttendanceReasonRow[] {
  const now = new Date().toISOString();
  const base: Array<Pick<AttendanceReasonRow, "code" | "label" | "category" | "is_excused">> = [
    { code: "illness", label: "Illness", category: "illness", is_excused: true },
    { code: "family_emergency", label: "Family emergency", category: "family", is_excused: true },
    { code: "travel", label: "Travel", category: "travel", is_excused: false },
    { code: "school_event", label: "School event", category: "school", is_excused: true },
    { code: "weather", label: "Weather", category: "weather", is_excused: true },
    { code: "makeup_scheduled", label: "Makeup scheduled", category: "makeup", is_excused: true },
    { code: "no_reason", label: "No reason given", category: "other", is_excused: false },
  ];

  return base.map((b, i) => ({
    id: `builtin-${b.code}`,
    tenant_id: tenantId,
    code: b.code,
    label: b.label,
    category: b.category,
    is_excused: b.is_excused,
    is_active: true,
    sort_order: i,
    created_at: now,
    updated_at: now,
  }));
}
