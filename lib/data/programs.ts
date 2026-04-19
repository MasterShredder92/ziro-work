import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "programs";

export type ProgramRow = {
  id: string;
  tenant_id: string;
  slug: string | null;
  name: string;
  description: string | null;
  instrument: string | null;
  level_count: number | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgramFilter = {
  is_active?: boolean;
  instrument?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_programs_store?: Map<string, ProgramRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, ProgramRow> {
  if (!g.__ziro_programs_store) g.__ziro_programs_store = new Map();
  return g.__ziro_programs_store;
}

export async function listPrograms(
  tenantId: string,
  filter?: ProgramFilter,
  opts?: ListOptions,
): Promise<ProgramRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (typeof filter?.is_active === "boolean")
        query = query.eq("is_active", filter.is_active);
      if (filter?.instrument) query = query.eq("instrument", filter.instrument);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "sort_order",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ProgramRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (typeof filter?.is_active === "boolean" ? r.is_active === filter.is_active : true))
    .filter((r) => (filter?.instrument ? r.instrument === filter.instrument : true))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getProgram(
  programId: string,
  tenantId?: string,
): Promise<ProgramRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", programId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ProgramRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(programId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}
