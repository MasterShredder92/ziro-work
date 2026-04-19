import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "assessment_questions";

export type QuestionKind =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "rubric"
  | "performance";

export type QuestionOption = {
  id: string;
  label: string;
  is_correct?: boolean;
};

export type AssessmentQuestionRow = {
  id: string;
  tenant_id: string;
  assessment_id: string;
  section_id: string | null;
  prompt: string;
  kind: QuestionKind;
  options: QuestionOption[];
  points: number;
  rubric_criterion_id: string | null;
  difficulty: "intro" | "core" | "advanced" | null;
  sort_order: number;
  correct_answer: string | null;
  explanation: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_assessment_questions_store?: Map<string, AssessmentQuestionRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, AssessmentQuestionRow> {
  if (!g.__ziro_assessment_questions_store)
    g.__ziro_assessment_questions_store = new Map();
  return g.__ziro_assessment_questions_store;
}

export async function listAssessmentQuestions(
  assessmentId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AssessmentQuestionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase
        .from(TABLE)
        .select("*")
        .eq("assessment_id", assessmentId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AssessmentQuestionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.assessment_id === assessmentId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function upsertAssessmentQuestion(
  tenantId: string,
  input: Partial<AssessmentQuestionRow> & {
    assessment_id: string;
    prompt: string;
    kind: QuestionKind;
  },
): Promise<AssessmentQuestionRow> {
  const now = new Date().toISOString();
  const row: AssessmentQuestionRow = {
    id: input.id ?? `q_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    tenant_id: tenantId,
    assessment_id: input.assessment_id,
    section_id: input.section_id ?? null,
    prompt: input.prompt,
    kind: input.kind,
    options: Array.isArray(input.options) ? input.options : [],
    points: typeof input.points === "number" ? input.points : 1,
    rubric_criterion_id: input.rubric_criterion_id ?? null,
    difficulty: input.difficulty ?? null,
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
    correct_answer: input.correct_answer ?? null,
    explanation: input.explanation ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AssessmentQuestionRow;
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
