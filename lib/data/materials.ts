import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "lesson_materials";

export type MaterialKind = "video" | "pdf" | "link" | "sheet" | "audio" | "note";

export type MaterialRow = {
  id: string;
  tenant_id: string;
  lesson_id: string;
  title: string;
  kind: MaterialKind;
  url: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_materials_store?: Map<string, MaterialRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MaterialRow> {
  if (!g.__ziro_materials_store) g.__ziro_materials_store = new Map();
  return g.__ziro_materials_store;
}

export async function listMaterials(
  lessonId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<MaterialRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("lesson_id", lessonId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as MaterialRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.lesson_id === lessonId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
