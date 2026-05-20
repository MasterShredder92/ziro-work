import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "automation_workflows";

export type AutomationWorkflowStatus = "draft" | "active" | "paused" | "archived";

export type AutomationTriggerDef = {
  type: string;
  config?: Record<string, unknown>;
  filters?: Record<string, unknown> | null;
};

export type AutomationActionDef = {
  id: string;
  type: string;
  label?: string | null;
  config?: Record<string, unknown>;
  next?: string | null;
  onError?: "continue" | "fail" | "retry" | null;
  retryMax?: number | null;
  branches?: {
    when?: string | null;
    true?: string | null;
    false?: string | null;
  } | null;
};

export type AutomationWorkflowRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: AutomationWorkflowStatus;
  trigger: AutomationTriggerDef;
  actions: AutomationActionDef[];
  concurrency_limit: number | null;
  retry_max: number;
  retry_backoff_ms: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
};

export type AutomationWorkflowFilter = {
  status?: AutomationWorkflowStatus;
  triggerType?: string;
  tag?: string;
  search?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_automation_workflows_store?: Map<string, AutomationWorkflowRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, AutomationWorkflowRow> {
  if (!g.__ziro_automation_workflows_store) {
    g.__ziro_automation_workflows_store = new Map();
  }
  return g.__ziro_automation_workflows_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `wf_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<AutomationWorkflowRow>,
): AutomationWorkflowRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    name: String(input.name ?? "Untitled workflow"),
    description: input.description ?? null,
    status: (input.status ?? "draft") as AutomationWorkflowStatus,
    trigger: (input.trigger as AutomationTriggerDef) ?? {
      type: "custom.webhook",
    },
    actions: Array.isArray(input.actions) ? input.actions : [],
    concurrency_limit:
      typeof input.concurrency_limit === "number"
        ? input.concurrency_limit
        : null,
    retry_max: typeof input.retry_max === "number" ? input.retry_max : 3,
    retry_backoff_ms:
      typeof input.retry_backoff_ms === "number"
        ? input.retry_backoff_ms
        : 1000,
    tags: Array.isArray(input.tags) ? input.tags : [],
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
    last_run_at: input.last_run_at ?? null,
    last_run_status: input.last_run_status ?? null,
  };
}

export async function listAutomationWorkflows(
  tenantId: string,
  filter?: AutomationWorkflowFilter,
  opts?: ListOptions,
): Promise<AutomationWorkflowRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.triggerType)
        query = query.contains("trigger", { type: filter.triggerType });
      if (filter?.tag) query = query.contains("tags", [filter.tag]);
      if (filter?.search && filter.search.trim().length > 0) {
        query = query.ilike("name", `%${filter.search.trim()}%`);
      }
      query = applyListOptions(
        query.order("updated_at", { ascending: false }),
        opts,
      );
      const { data, error } = await query;
      if (!error) return (data ?? []) as AutomationWorkflowRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  let all = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
  if (filter?.status) all = all.filter((r) => r.status === filter.status);
  if (filter?.triggerType)
    all = all.filter((r) => r.trigger?.type === filter.triggerType);
  if (filter?.tag) all = all.filter((r) => r.tags.includes(filter.tag!));
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    all = all.filter((r) => r.name.toLowerCase().includes(q));
  }
  all.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (opts?.limit) all = all.slice(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit);
  return all;
}

export async function getAutomationWorkflow(
  workflowId: string,
  tenantId: string,
): Promise<AutomationWorkflowRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", workflowId)
        .maybeSingle();
      if (!error) return (data ?? null) as AutomationWorkflowRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(workflowId);
  if (!row || row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertAutomationWorkflow(
  tenantId: string,
  input: Partial<AutomationWorkflowRow> & { name: string },
): Promise<AutomationWorkflowRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as AutomationWorkflowRow;
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

export async function deleteAutomationWorkflow(
  workflowId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", workflowId);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(workflowId);
  if (row && row.tenant_id === tenantId) store().delete(workflowId);
}

export async function updateWorkflowRunMetadata(
  workflowId: string,
  tenantId: string,
  lastRunAt: string,
  lastRunStatus: string,
): Promise<void> {
  const existing = await getAutomationWorkflow(workflowId, tenantId);
  if (!existing) return;
  await upsertAutomationWorkflow(tenantId, {
    ...existing,
    last_run_at: lastRunAt,
    last_run_status: lastRunStatus,
  });
}
