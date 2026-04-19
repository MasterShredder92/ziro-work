import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "automation_runs";

export type AutomationRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "dead_letter";

export type AutomationRunStep = {
  actionId: string;
  type: string;
  status: AutomationRunStatus | "skipped" | "retrying";
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  attempt?: number;
  output?: unknown;
  error?: { message: string; code?: string } | null;
};

export type AutomationRunRow = {
  id: string;
  tenant_id: string;
  workflow_id: string;
  trigger_type: string;
  status: AutomationRunStatus;
  payload: Record<string, unknown>;
  steps: AutomationRunStep[];
  logs?: Array<Record<string, unknown>>;
  attempt: number;
  max_attempts: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: { message: string; code?: string } | null;
  triggered_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationRunFilter = {
  workflowId?: string;
  status?: AutomationRunStatus;
  triggerType?: string;
  since?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_automation_runs_store?: Map<string, AutomationRunRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AutomationRunRow> {
  if (!g.__ziro_automation_runs_store) {
    g.__ziro_automation_runs_store = new Map();
  }
  return g.__ziro_automation_runs_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `run_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(input: Partial<AutomationRunRow>): AutomationRunRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    workflow_id: String(input.workflow_id ?? ""),
    trigger_type: String(input.trigger_type ?? "custom.webhook"),
    status: (input.status ?? "queued") as AutomationRunStatus,
    payload: (input.payload ?? {}) as Record<string, unknown>,
    steps: Array.isArray(input.steps) ? input.steps : [],
    logs: Array.isArray(input.logs)
      ? (input.logs as Array<Record<string, unknown>>)
      : [],
    attempt: typeof input.attempt === "number" ? input.attempt : 0,
    max_attempts:
      typeof input.max_attempts === "number" ? input.max_attempts : 3,
    started_at: input.started_at ?? now,
    finished_at: input.finished_at ?? null,
    duration_ms:
      typeof input.duration_ms === "number" ? input.duration_ms : null,
    error: input.error ?? null,
    triggered_by: input.triggered_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listAutomationRuns(
  tenantId: string,
  filter?: AutomationRunFilter,
  opts?: ListOptions,
): Promise<AutomationRunRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.workflowId) query = query.eq("workflow_id", filter.workflowId);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.triggerType)
        query = query.eq("trigger_type", filter.triggerType);
      if (filter?.since) query = query.gte("created_at", filter.since);
      query = applyListOptions(
        query.order("created_at", { ascending: false }),
        opts,
      );
      const { data, error } = await query;
      if (!error) return (data ?? []) as AutomationRunRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  let all = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
  if (filter?.workflowId)
    all = all.filter((r) => r.workflow_id === filter.workflowId);
  if (filter?.status) all = all.filter((r) => r.status === filter.status);
  if (filter?.triggerType)
    all = all.filter((r) => r.trigger_type === filter.triggerType);
  if (filter?.since) all = all.filter((r) => r.created_at >= filter.since!);
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (opts?.limit) all = all.slice(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit);
  return all;
}

export async function getAutomationRun(
  runId: string,
  tenantId: string,
): Promise<AutomationRunRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", runId)
        .maybeSingle();
      if (!error) return (data ?? null) as AutomationRunRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(runId);
  if (!row || row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertAutomationRun(
  tenantId: string,
  input: Partial<AutomationRunRow> & { workflow_id: string },
): Promise<AutomationRunRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AutomationRunRow;
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

export async function countRunningForTenant(
  tenantId: string,
): Promise<number> {
  const rows = await listAutomationRuns(tenantId, { status: "running" });
  return rows.length;
}

export async function countRunningForWorkflow(
  tenantId: string,
  workflowId: string,
): Promise<number> {
  const rows = await listAutomationRuns(tenantId, {
    status: "running",
    workflowId,
  });
  return rows.length;
}
