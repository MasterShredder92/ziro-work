import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_plan_material_links";

export type LessonMaterialLinkKind =
  | "video"
  | "pdf"
  | "link"
  | "sheet"
  | "audio"
  | "note"
  | "slide"
  | "other";

export type LessonMaterialLinkRow = {
  id: string;
  tenant_id: string;
  plan_id: string;
  material_id: string | null;
  title: string;
  url: string | null;
  kind: LessonMaterialLinkKind;
  notes: string | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_lesson_material_links_store?: Map<string, LessonMaterialLinkRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonMaterialLinkRow> {
  if (!g.__ziro_lesson_material_links_store)
    g.__ziro_lesson_material_links_store = new Map();
  return g.__ziro_lesson_material_links_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `lpm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(
  input: Partial<LessonMaterialLinkRow> & { plan_id: string; title: string },
): LessonMaterialLinkRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    plan_id: input.plan_id,
    material_id: input.material_id ?? null,
    title: input.title,
    url: input.url ?? null,
    kind: (input.kind ?? "link") as LessonMaterialLinkKind,
    notes: input.notes ?? null,
    is_required: Boolean(input.is_required),
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listLessonMaterialLinks(
  planId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonMaterialLinkRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("plan_id", planId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonMaterialLinkRow[];
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

export async function upsertLessonMaterialLink(
  tenantId: string,
  input: Partial<LessonMaterialLinkRow> & { plan_id: string; title: string },
): Promise<LessonMaterialLinkRow> {
  const row = normalize({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as LessonMaterialLinkRow;
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
