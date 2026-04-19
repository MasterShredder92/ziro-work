import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "program_lessons";

export type LessonRow = {
  id: string;
  tenant_id: string;
  unit_id: string;
  level_id: string | null;
  program_id: string | null;
  title: string;
  objective: string | null;
  summary: string | null;
  estimated_minutes: number | null;
  sort_order: number | null;
  difficulty: "intro" | "core" | "advanced" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonFilter = {
  unit_id?: string;
  level_id?: string;
  program_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lessons_store?: Map<string, LessonRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonRow> {
  if (!g.__ziro_lessons_store) g.__ziro_lessons_store = new Map();
  return g.__ziro_lessons_store;
}

export async function listLessons(
  unitId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("unit_id", unitId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.unit_id === unitId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getLesson(
  lessonId: string,
  tenantId?: string,
): Promise<LessonRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", lessonId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as LessonRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(lessonId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}
