import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  RecurringRule,
  RecurringRuleInsert,
  RecurringRuleUpdate,
} from "@/lib/schedule/types";

const TABLE = "recurring_rules";

type Row = {
  id: string;
  tenant_id: string;
  frequency: string;
  interval: number;
  by_weekday: number[] | null;
  start_date: string;
  end_date: string | null;
  count: number | null;
  exceptions: string[] | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_recurring_rules_store?: Map<string, Row>;
};
const g = globalThis as GlobalStore;
function store(): Map<string, Row> {
  if (!g.__ziro_recurring_rules_store)
    g.__ziro_recurring_rules_store = new Map();
  return g.__ziro_recurring_rules_store;
}

function rowToRule(r: Row): RecurringRule {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    frequency: r.frequency as RecurringRule["frequency"],
    interval: r.interval,
    byWeekday: r.by_weekday,
    startDate: r.start_date,
    endDate: r.end_date,
    count: r.count,
    exceptions: r.exceptions ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function ruleToRow(tenantId: string, input: RecurringRuleInsert): Row {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `rec_${Math.random().toString(36).slice(2, 10)}`,
    tenant_id: tenantId,
    frequency: input.frequency,
    interval: input.interval,
    by_weekday: input.byWeekday ?? null,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    count: input.count ?? null,
    exceptions: input.exceptions ?? [],
    created_at: now,
    updated_at: now,
  };
}

export async function listRecurringRules(
  tenantId: string,
  opts?: ListOptions,
): Promise<RecurringRule[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "start_date",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return ((data as Row[]) ?? []).map(rowToRule);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1))
    .map(rowToRule);
}

export async function getRecurringRule(
  id: string,
  tenantId: string,
): Promise<RecurringRule | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
      if (!error) return data ? rowToRule(data as Row) : null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (!r || r.tenant_id !== tenantId) return null;
  return rowToRule(r);
}

export async function createRecurringRule(
  tenantId: string,
  input: RecurringRuleInsert,
): Promise<RecurringRule> {
  const row = ruleToRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
      if (!error) return rowToRule(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().set(row.id, row);
  return rowToRule(row);
}

export async function updateRecurringRule(
  id: string,
  tenantId: string,
  patch: RecurringRuleUpdate,
): Promise<RecurringRule> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.frequency !== undefined) update.frequency = patch.frequency;
  if (patch.interval !== undefined) update.interval = patch.interval;
  if (patch.byWeekday !== undefined) update.by_weekday = patch.byWeekday;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.endDate !== undefined) update.end_date = patch.endDate;
  if (patch.count !== undefined) update.count = patch.count;
  if (patch.exceptions !== undefined) update.exceptions = patch.exceptions;

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .update(update)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (!error) return rowToRule(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`recurring_rule ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowToRule(next);
}

export async function deleteRecurringRule(
  id: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (r && r.tenant_id === tenantId) store().delete(id);
}
