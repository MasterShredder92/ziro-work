import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "automation_logs";

export type AutomationLogLevel = "info" | "warn" | "error" | "debug";

export type AutomationLogRow = {
  id: string;
  tenant_id: string;
  run_id: string | null;
  workflow_id: string | null;
  action_id: string | null;
  level: AutomationLogLevel;
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type AutomationLogFilter = {
  runId?: string;
  workflowId?: string;
  level?: AutomationLogLevel;
  actionId?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_automation_logs_store?: Map<string, AutomationLogRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AutomationLogRow> {
  if (!g.__ziro_automation_logs_store) {
    g.__ziro_automation_logs_store = new Map();
  }
  return g.__ziro_automation_logs_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `log_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(input: Partial<AutomationLogRow>): AutomationLogRow {
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    run_id: input.run_id ?? null,
    workflow_id: input.workflow_id ?? null,
    action_id: input.action_id ?? null,
    level: (input.level ?? "info") as AutomationLogLevel,
    message: String(input.message ?? ""),
    data: (input.data as Record<string, unknown> | null) ?? null,
    created_at: input.created_at ?? nowIso(),
  };
}

export async function listAutomationLogs(
  tenantId: string,
  filter?: AutomationLogFilter,
  opts?: ListOptions,
): Promise<AutomationLogRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.runId) query = query.eq("run_id", filter.runId);
      if (filter?.workflowId) query = query.eq("workflow_id", filter.workflowId);
      if (filter?.actionId) query = query.eq("action_id", filter.actionId);
      if (filter?.level) query = query.eq("level", filter.level);
      query = applyListOptions(
        query.order("created_at", { ascending: true }),
        opts,
      );
      const { data, error } = await query;
      if (!error) return (data ?? []) as AutomationLogRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  let all = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
  if (filter?.runId) all = all.filter((r) => r.run_id === filter.runId);
  if (filter?.workflowId)
    all = all.filter((r) => r.workflow_id === filter.workflowId);
  if (filter?.actionId) all = all.filter((r) => r.action_id === filter.actionId);
  if (filter?.level) all = all.filter((r) => r.level === filter.level);
  all.sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (opts?.limit) all = all.slice(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit);
  return all;
}

export async function insertAutomationLog(
  tenantId: string,
  input: Omit<Partial<AutomationLogRow>, "tenant_id"> & { message: string },
): Promise<AutomationLogRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
      if (!error && data) return data as AutomationLogRow;
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
