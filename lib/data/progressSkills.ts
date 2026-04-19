import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "progress_skills";

export type ProgressSkillStatus =
  | "not_started"
  | "developing"
  | "proficient"
  | "mastered";

export type ProgressSkillRow = {
  id: string;
  tenant_id: string;
  goal_id: string;
  student_id: string;
  title: string;
  description: string | null;
  rubric: string | null;
  status: ProgressSkillStatus;
  mastery_score: number | null;
  teacher_id: string | null;
  mastered_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgressSkillFilter = {
  goal_id?: string;
  student_id?: string;
  status?: ProgressSkillStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_progress_skills_store?: Map<string, ProgressSkillRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ProgressSkillRow> {
  if (!g.__ziro_progress_skills_store)
    g.__ziro_progress_skills_store = new Map();
  return g.__ziro_progress_skills_store;
}

export async function listSkills(
  filter: ProgressSkillFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<ProgressSkillRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.goal_id) query = query.eq("goal_id", filter.goal_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.status) query = query.eq("status", filter.status);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 1000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ProgressSkillRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.created_at.localeCompare(b.created_at),
    );
}

export type UpsertSkillInput = Partial<ProgressSkillRow> & {
  tenant_id: string;
  goal_id: string;
  student_id: string;
  title: string;
};

export async function upsertSkill(
  input: UpsertSkillInput,
): Promise<ProgressSkillRow> {
  const now = new Date().toISOString();
  const row: ProgressSkillRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    goal_id: input.goal_id,
    student_id: input.student_id,
    title: input.title,
    description: input.description ?? null,
    rubric: input.rubric ?? null,
    status: (input.status as ProgressSkillStatus) ?? "not_started",
    mastery_score: input.mastery_score ?? null,
    teacher_id: input.teacher_id ?? null,
    mastered_at: input.mastered_at ?? null,
    sort_order: input.sort_order ?? 0,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(input.tenant_id);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as ProgressSkillRow;
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
