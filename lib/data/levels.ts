import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "program_levels";

export type LevelRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  code: string | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_levels_store?: Map<string, LevelRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LevelRow> {
  if (!g.__ziro_levels_store) g.__ziro_levels_store = new Map();
  return g.__ziro_levels_store;
}

export async function listLevels(
  programId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LevelRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("program_id", programId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LevelRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.program_id === programId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getLevel(
  levelId: string,
  tenantId?: string,
): Promise<LevelRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", levelId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as LevelRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(levelId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}
