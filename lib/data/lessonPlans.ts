import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_plans";

export type LessonPlanStatus = "draft" | "ready" | "published" | "archived";
export type LessonPlanSource = "manual" | "ai_draft" | "template";

export type LessonPlanRow = {
  id: string;
  tenant_id: string;
  title: string;
  summary: string | null;
  subject: string | null;
  grade_level: string | null;
  duration_minutes: number | null;
  program_id: string | null;
  unit_id: string | null;
  lesson_id: string | null;
  level_id: string | null;
  teacher_id: string | null;
  author_id: string | null;
  status: LessonPlanStatus;
  source: LessonPlanSource;
  curriculum_alignment: string[];
  standards: string[];
  current_version: number;
  last_ai_draft_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type LessonPlanFilter = {
  status?: LessonPlanStatus;
  teacher_id?: string;
  program_id?: string;
  unit_id?: string;
  lesson_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_plans_store?: Map<string, LessonPlanRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonPlanRow> {
  if (!g.__ziro_lesson_plans_store) g.__ziro_lesson_plans_store = new Map();
  return g.__ziro_lesson_plans_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `lp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function normalizeRow(input: Partial<LessonPlanRow>): LessonPlanRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    title: String(input.title ?? "Untitled lesson plan"),
    summary: input.summary ?? null,
    subject: input.subject ?? null,
    grade_level: input.grade_level ?? null,
    duration_minutes: input.duration_minutes ?? null,
    program_id: input.program_id ?? null,
    unit_id: input.unit_id ?? null,
    lesson_id: input.lesson_id ?? null,
    level_id: input.level_id ?? null,
    teacher_id: input.teacher_id ?? null,
    author_id: input.author_id ?? null,
    status: (input.status ?? "draft") as LessonPlanStatus,
    source: (input.source ?? "manual") as LessonPlanSource,
    curriculum_alignment: toStringArray(input.curriculum_alignment),
    standards: toStringArray(input.standards),
    current_version:
      typeof input.current_version === "number" ? input.current_version : 1,
    last_ai_draft_at: input.last_ai_draft_at ?? null,
    tags: toStringArray(input.tags),
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listLessonPlans(
  tenantId: string,
  filter?: LessonPlanFilter,
  opts?: ListOptions,
): Promise<LessonPlanRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
      if (filter?.program_id) query = query.eq("program_id", filter.program_id);
      if (filter?.unit_id) query = query.eq("unit_id", filter.unit_id);
      if (filter?.lesson_id) query = query.eq("lesson_id", filter.lesson_id);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonPlanRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (filter?.status ? r.status === filter.status : true))
    .filter((r) =>
      filter?.teacher_id ? r.teacher_id === filter.teacher_id : true,
    )
    .filter((r) =>
      filter?.program_id ? r.program_id === filter.program_id : true,
    )
    .filter((r) => (filter?.unit_id ? r.unit_id === filter.unit_id : true))
    .filter((r) =>
      filter?.lesson_id ? r.lesson_id === filter.lesson_id : true,
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getLessonPlan(
  planId: string,
  tenantId?: string,
): Promise<LessonPlanRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", planId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as LessonPlanRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(planId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertLessonPlan(
  tenantId: string,
  input: Partial<LessonPlanRow> & { title?: string },
): Promise<LessonPlanRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as LessonPlanRow;
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
