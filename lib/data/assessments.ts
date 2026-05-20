import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "assessments";

export type AssessmentKind = "quiz" | "exam" | "rubric" | "practice";
export type AssessmentStatus = "draft" | "published" | "archived";

export type AssessmentSectionDef = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
};

export type AssessmentRow = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  kind: AssessmentKind;
  status: AssessmentStatus;
  program_id: string | null;
  lesson_id: string | null;
  level_id: string | null;
  passing_score: number | null;
  total_points: number | null;
  duration_minutes: number | null;
  sections: AssessmentSectionDef[];
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentFilter = {
  kind?: AssessmentKind;
  status?: AssessmentStatus;
  program_id?: string;
  lesson_id?: string;
  author_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_assessments_store?: Map<string, AssessmentRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, AssessmentRow> {
  if (!g.__ziro_assessments_store) g.__ziro_assessments_store = new Map();
  return g.__ziro_assessments_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `asmt_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(input: Partial<AssessmentRow>): AssessmentRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    title: String(input.title ?? "Untitled assessment"),
    description: input.description ?? null,
    kind: (input.kind ?? "quiz") as AssessmentKind,
    status: (input.status ?? "draft") as AssessmentStatus,
    program_id: input.program_id ?? null,
    lesson_id: input.lesson_id ?? null,
    level_id: input.level_id ?? null,
    passing_score: input.passing_score ?? null,
    total_points: input.total_points ?? null,
    duration_minutes: input.duration_minutes ?? null,
    sections: Array.isArray(input.sections) ? input.sections : [],
    author_id: input.author_id ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listAssessments(
  tenantId: string,
  filter?: AssessmentFilter,
  opts?: ListOptions,
): Promise<AssessmentRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.kind) query = query.eq("kind", filter.kind);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.program_id) query = query.eq("program_id", filter.program_id);
      if (filter?.lesson_id) query = query.eq("lesson_id", filter.lesson_id);
      if (filter?.author_id) query = query.eq("author_id", filter.author_id);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AssessmentRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (filter?.kind ? r.kind === filter.kind : true))
    .filter((r) => (filter?.status ? r.status === filter.status : true))
    .filter((r) => (filter?.program_id ? r.program_id === filter.program_id : true))
    .filter((r) => (filter?.lesson_id ? r.lesson_id === filter.lesson_id : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getAssessment(
  assessmentId: string,
  tenantId?: string,
): Promise<AssessmentRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", assessmentId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as AssessmentRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(assessmentId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertAssessment(
  tenantId: string,
  input: Partial<AssessmentRow> & { title?: string },
): Promise<AssessmentRow> {
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
      if (!error && data) return data as AssessmentRow;
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
