import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "program_units";

export type UnitRow = {
  id: string;
  tenant_id: string;
  level_id: string;
  program_id: string | null;
  name: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_units_store?: Map<string, UnitRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, UnitRow> {
  if (!g.__ziro_units_store) g.__ziro_units_store = new Map();
  return g.__ziro_units_store;
}

export async function listUnits(
  levelId: string,
  tenantId?: string,
  opts?: ListOptions,
): Promise<UnitRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("level_id", levelId);
      if (tenantId) query = query.eq("tenant_id", tenantId);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as UnitRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.level_id === levelId)
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getUnit(
  unitId: string,
  tenantId?: string,
): Promise<UnitRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", unitId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as UnitRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(unitId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}
