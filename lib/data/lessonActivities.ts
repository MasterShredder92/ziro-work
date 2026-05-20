import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_activities";

export type LessonActivityKind =
  | "warmup"
  | "direct_instruction"
  | "guided_practice"
  | "independent_practice"
  | "performance"
  | "assessment"
  | "reflection"
  | "closure";

export type LessonActivityRow = {
  id: string;
  tenant_id: string;
  plan_id: string;
  title: string;
  description: string | null;
  kind: LessonActivityKind;
  duration_minutes: number | null;
  grouping: string | null;
  resources: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_activities_store?: Map<string, LessonActivityRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonActivityRow> {
  if (!g.__ziro_lesson_activities_store)
    g.__ziro_lesson_activities_store = new Map();
  return g.__ziro_lesson_activities_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `act_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(
  input: Partial<LessonActivityRow> & { plan_id: string; title: string },
): LessonActivityRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    plan_id: input.plan_id,
    title: input.title,
    description: input.description ?? null,
    kind: (input.kind ?? "direct_instruction") as LessonActivityKind,
    duration_minutes: input.duration_minutes ?? null,
    grouping: input.grouping ?? null,
    resources: Array.isArray(input.resources)
      ? input.resources.filter((v): v is string => typeof v === "string")
      : [],
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listLessonActivities(
  planId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonActivityRow[]> {
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
      if (!error) return (data ?? []) as LessonActivityRow[];
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

export async function upsertLessonActivity(
  tenantId: string,
  input: Partial<LessonActivityRow> & { plan_id: string; title: string },
): Promise<LessonActivityRow> {
  const row = normalize({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as LessonActivityRow;
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
