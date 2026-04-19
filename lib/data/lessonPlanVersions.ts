import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_plan_versions";

export type LessonPlanVersionSource = "manual" | "ai_draft" | "import";

export type LessonPlanVersionSnapshot = {
  title?: string;
  summary?: string | null;
  objectives?: Array<{
    id?: string;
    text: string;
    bloom_level?: string | null;
    order?: number;
  }>;
  activities?: Array<{
    id?: string;
    title: string;
    description?: string | null;
    kind?: string | null;
    duration_minutes?: number | null;
    order?: number;
  }>;
  materials?: Array<{
    id?: string;
    title: string;
    url?: string | null;
    material_id?: string | null;
    kind?: string | null;
  }>;
  notes?: string | null;
};

export type LessonPlanVersionRow = {
  id: string;
  tenant_id: string;
  plan_id: string;
  version: number;
  label: string | null;
  summary: string | null;
  source: LessonPlanVersionSource;
  author_id: string | null;
  ai_prompt: string | null;
  ai_model: string | null;
  ai_metadata: Record<string, unknown>;
  snapshot: LessonPlanVersionSnapshot;
  created_at: string;
};

export type LessonPlanVersionFilter = {
  plan_id?: string;
  source?: LessonPlanVersionSource;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_plan_versions_store?: Map<string, LessonPlanVersionRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonPlanVersionRow> {
  if (!g.__ziro_lesson_plan_versions_store)
    g.__ziro_lesson_plan_versions_store = new Map();
  return g.__ziro_lesson_plan_versions_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `lpv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<LessonPlanVersionRow> & { plan_id: string; version: number },
): LessonPlanVersionRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    plan_id: input.plan_id,
    version: input.version,
    label: input.label ?? null,
    summary: input.summary ?? null,
    source: (input.source ?? "manual") as LessonPlanVersionSource,
    author_id: input.author_id ?? null,
    ai_prompt: input.ai_prompt ?? null,
    ai_model: input.ai_model ?? null,
    ai_metadata:
      input.ai_metadata && typeof input.ai_metadata === "object"
        ? (input.ai_metadata as Record<string, unknown>)
        : {},
    snapshot:
      input.snapshot && typeof input.snapshot === "object"
        ? input.snapshot
        : {},
    created_at: input.created_at ?? now,
  };
}

export async function listLessonPlanVersions(
  filter: LessonPlanVersionFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonPlanVersionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.plan_id) query = query.eq("plan_id", filter.plan_id);
      if (filter.source) query = query.eq("source", filter.source);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "version",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonPlanVersionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.plan_id ? r.plan_id === filter.plan_id : true))
    .filter((r) => (filter.source ? r.source === filter.source : true))
    .sort((a, b) => b.version - a.version);
}

export async function upsertLessonPlanVersion(
  tenantId: string,
  input: Partial<LessonPlanVersionRow> & {
    plan_id: string;
    version: number;
  },
): Promise<LessonPlanVersionRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as LessonPlanVersionRow;
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
