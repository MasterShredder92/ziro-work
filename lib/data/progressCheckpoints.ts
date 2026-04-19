import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "progress_checkpoints";

export type ProgressCheckpointStatus =
  | "pending"
  | "in_progress"
  | "passed"
  | "needs_review"
  | "failed";

export type ProgressCheckpointRow = {
  id: string;
  tenant_id: string;
  skill_id: string;
  goal_id: string | null;
  student_id: string;
  title: string;
  description: string | null;
  status: ProgressCheckpointStatus;
  score: number | null;
  teacher_id: string | null;
  teacher_feedback: string | null;
  scored_at: string | null;
  due_date: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgressCheckpointFilter = {
  skill_id?: string;
  student_id?: string;
  goal_id?: string;
  status?: ProgressCheckpointStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_progress_checkpoints_store?: Map<string, ProgressCheckpointRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ProgressCheckpointRow> {
  if (!g.__ziro_progress_checkpoints_store)
    g.__ziro_progress_checkpoints_store = new Map();
  return g.__ziro_progress_checkpoints_store;
}

export async function listCheckpoints(
  filter: ProgressCheckpointFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<ProgressCheckpointRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.skill_id) query = query.eq("skill_id", filter.skill_id);
      if (filter.goal_id) query = query.eq("goal_id", filter.goal_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.status) query = query.eq("status", filter.status);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 2000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ProgressCheckpointRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.skill_id ? r.skill_id === filter.skill_id : true))
    .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.created_at.localeCompare(b.created_at),
    );
}

export async function getCheckpointById(
  id: string,
  tenantId?: string,
): Promise<ProgressCheckpointRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ProgressCheckpointRow | null;
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

export type UpsertCheckpointInput = Partial<ProgressCheckpointRow> & {
  tenant_id: string;
  skill_id: string;
  student_id: string;
  title: string;
};

export async function upsertCheckpoint(
  input: UpsertCheckpointInput,
): Promise<ProgressCheckpointRow> {
  const now = new Date().toISOString();
  const row: ProgressCheckpointRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    skill_id: input.skill_id,
    goal_id: input.goal_id ?? null,
    student_id: input.student_id,
    title: input.title,
    description: input.description ?? null,
    status: (input.status as ProgressCheckpointStatus) ?? "pending",
    score: input.score ?? null,
    teacher_id: input.teacher_id ?? null,
    teacher_feedback: input.teacher_feedback ?? null,
    scored_at: input.scored_at ?? null,
    due_date: input.due_date ?? null,
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
      if (!error && data) return data as ProgressCheckpointRow;
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
