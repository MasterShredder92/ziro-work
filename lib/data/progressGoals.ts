import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "progress_goals";

export type ProgressGoalStatus =
  | "draft"
  | "active"
  | "completed"
  | "archived";

export type ProgressGoalRow = {
  id: string;
  tenant_id: string;
  student_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: ProgressGoalStatus;
  target_date: string | null;
  completed_at: string | null;
  teacher_id: string | null;
  created_by: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgressGoalFilter = {
  student_id?: string;
  status?: ProgressGoalStatus;
  teacher_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_progress_goals_store?: Map<string, ProgressGoalRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ProgressGoalRow> {
  if (!g.__ziro_progress_goals_store)
    g.__ziro_progress_goals_store = new Map();
  return g.__ziro_progress_goals_store;
}

export async function listGoals(
  filter: ProgressGoalFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<ProgressGoalRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.teacher_id) query = query.eq("teacher_id", filter.teacher_id);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ProgressGoalRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.created_at.localeCompare(b.created_at),
    );
}

export type UpsertGoalInput = Partial<ProgressGoalRow> & {
  tenant_id: string;
  student_id: string;
  title: string;
};

export async function upsertGoal(
  input: UpsertGoalInput,
): Promise<ProgressGoalRow> {
  const now = new Date().toISOString();
  const row: ProgressGoalRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    student_id: input.student_id,
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    status: (input.status as ProgressGoalStatus) ?? "active",
    target_date: input.target_date ?? null,
    completed_at: input.completed_at ?? null,
    teacher_id: input.teacher_id ?? null,
    created_by: input.created_by ?? null,
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
      if (!error && data) return data as ProgressGoalRow;
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
