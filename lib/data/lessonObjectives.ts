import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_objectives";

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export type LessonObjectiveRow = {
  id: string;
  tenant_id: string;
  plan_id: string;
  text: string;
  bloom_level: BloomLevel | null;
  standard_code: string | null;
  sort_order: number;
  is_met: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_objectives_store?: Map<string, LessonObjectiveRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonObjectiveRow> {
  if (!g.__ziro_lesson_objectives_store)
    g.__ziro_lesson_objectives_store = new Map();
  return g.__ziro_lesson_objectives_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `obj_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(
  input: Partial<LessonObjectiveRow> & { plan_id: string; text: string },
): LessonObjectiveRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    plan_id: input.plan_id,
    text: input.text,
    bloom_level: input.bloom_level ?? null,
    standard_code: input.standard_code ?? null,
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
    is_met: Boolean(input.is_met),
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listLessonObjectives(
  planId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonObjectiveRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("plan_id", planId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonObjectiveRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.plan_id === planId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function upsertLessonObjective(
  tenantId: string,
  input: Partial<LessonObjectiveRow> & { plan_id: string; text: string },
): Promise<LessonObjectiveRow> {
  const row = normalize({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as LessonObjectiveRow;
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
