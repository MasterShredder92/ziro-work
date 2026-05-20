import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "assessment_attempts";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "graded"
  | "returned"
  | "abandoned";

export type AttemptAnswer = {
  question_id: string;
  response: string | string[] | number | null;
  auto_score?: number | null;
  manual_score?: number | null;
  rubric_scores?: Record<string, number> | null;
  is_correct?: boolean | null;
  teacher_notes?: string | null;
};

export type AssessmentAttemptRow = {
  id: string;
  tenant_id: string;
  assessment_id: string;
  student_id: string;
  teacher_id: string | null;
  status: AttemptStatus;
  score: number | null;
  max_score: number | null;
  passed: boolean | null;
  answers: AttemptAnswer[];
  rubric_totals: Record<string, number>;
  feedback: string | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentAttemptFilter = {
  assessment_id?: string;
  student_id?: string;
  teacher_id?: string;
  status?: AttemptStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_assessment_attempts_store?: Map<string, AssessmentAttemptRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, AssessmentAttemptRow> {
  if (!g.__ziro_assessment_attempts_store)
    g.__ziro_assessment_attempts_store = new Map();
  return g.__ziro_assessment_attempts_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeRow(
  input: Partial<AssessmentAttemptRow>,
): AssessmentAttemptRow {
  const now = nowIso();
  const id =
    input.id ??
    `att_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    assessment_id: String(input.assessment_id ?? ""),
    student_id: String(input.student_id ?? ""),
    teacher_id: input.teacher_id ?? null,
    status: (input.status ?? "in_progress") as AttemptStatus,
    score: input.score ?? null,
    max_score: input.max_score ?? null,
    passed: input.passed ?? null,
    answers: Array.isArray(input.answers) ? input.answers : [],
    rubric_totals: input.rubric_totals ?? {},
    feedback: input.feedback ?? null,
    started_at: input.started_at ?? now,
    submitted_at: input.submitted_at ?? null,
    graded_at: input.graded_at ?? null,
    graded_by: input.graded_by ?? null,
    duration_seconds: input.duration_seconds ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listAssessmentAttempts(
  filter: AssessmentAttemptFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AssessmentAttemptRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.assessment_id)
        query = query.eq("assessment_id", filter.assessment_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
      if (filter.status) query = query.eq("status", filter.status);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AssessmentAttemptRow[];
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
      filter.assessment_id ? r.assessment_id === filter.assessment_id : true,
    )
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getAssessmentAttempt(
  attemptId: string,
  tenantId?: string,
): Promise<AssessmentAttemptRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", attemptId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as AssessmentAttemptRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(attemptId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertAssessmentAttempt(
  tenantId: string,
  input: Partial<AssessmentAttemptRow> & {
    assessment_id: string;
    student_id: string;
  },
): Promise<AssessmentAttemptRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AssessmentAttemptRow;
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
