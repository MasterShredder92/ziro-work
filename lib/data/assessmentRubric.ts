import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "assessment_rubric_criteria";

export type RubricLevelDef = {
  label: string;
  description: string | null;
  points: number;
};

export type AssessmentRubricRow = {
  id: string;
  tenant_id: string;
  assessment_id: string;
  criterion: string;
  description: string | null;
  max_points: number;
  weight: number;
  levels: RubricLevelDef[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_assessment_rubric_store?: Map<string, AssessmentRubricRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, AssessmentRubricRow> {
  if (!g.__ziro_assessment_rubric_store)
    g.__ziro_assessment_rubric_store = new Map();
  return g.__ziro_assessment_rubric_store;
}

export async function listAssessmentRubric(
  assessmentId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<AssessmentRubricRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase
        .from(TABLE)
        .select("*")
        .eq("assessment_id", assessmentId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as AssessmentRubricRow[];
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

export async function upsertAssessmentRubricCriterion(
  tenantId: string,
  input: Partial<AssessmentRubricRow> & {
    assessment_id: string;
    criterion: string;
  },
): Promise<AssessmentRubricRow> {
  const now = new Date().toISOString();
  const row: AssessmentRubricRow = {
    id: input.id ?? `rc_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    tenant_id: tenantId,
    assessment_id: input.assessment_id,
    criterion: input.criterion,
    description: input.description ?? null,
    max_points: typeof input.max_points === "number" ? input.max_points : 4,
    weight: typeof input.weight === "number" ? input.weight : 1,
    levels: Array.isArray(input.levels) ? input.levels : [],
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AssessmentRubricRow;
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
