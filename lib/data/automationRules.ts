import { clientFor } from "./_client";

export type AutomationRuleRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: Record<string, unknown>;
  conditions: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type AutomationRuleInsert = Omit<
  AutomationRuleRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

const TABLE = "automation_rules";

type GlobalWithCache = typeof globalThis & {
  __ziro_automation_rules_store?: Map<string, AutomationRuleRow>;
  __ziro_automation_rules_db_missing?: boolean;
};

const g = globalThis as GlobalWithCache;

function store(): Map<string, AutomationRuleRow> {
  if (!g.__ziro_automation_rules_store) {
    g.__ziro_automation_rules_store = new Map();
  }
  return g.__ziro_automation_rules_store;
}

function tableMissing(): boolean {
  return g.__ziro_automation_rules_db_missing === true;
}

function markTableMissing(): void {
  g.__ziro_automation_rules_db_missing = true;
}

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const rec = err as Record<string, unknown>;
  const code = typeof rec.code === "string" ? rec.code : null;
  const message = typeof rec.message === "string" ? rec.message : "";
  if (code === "42P01") return true;
  if (code === "PGRST205") return true;
  if (/relation .*automation_rules.* does not exist/i.test(message)) return true;
  if (/Could not find the table .*automation_rules/i.test(message)) return true;
  return false;
}

function newId(): string {
  return `auto_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeRow(input: Partial<AutomationRuleRow>): AutomationRuleRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    name: String(input.name ?? "Untitled automation"),
    description: input.description ?? null,
    enabled: input.enabled !== false,
    trigger: (input.trigger ?? {}) as Record<string, unknown>,
    conditions: Array.isArray(input.conditions)
      ? input.conditions
      : [],
    actions: Array.isArray(input.actions) ? input.actions : [],
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export async function listAutomationRules(
  tenantId: string,
): Promise<AutomationRuleRow[]> {
  if (!tableMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false });
      if (!error) {
        return (data ?? []) as AutomationRuleRow[];
      }
      if (isMissingTableError(error)) {
        markTableMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err)) {
        markTableMissing();
      } else {
        throw err;
      }
    }
  }

  const all = Array.from(store().values()).filter(
    (r) => r.tenant_id === tenantId,
  );
  return all.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getAutomationRule(
  ruleId: string,
  tenantId: string,
): Promise<AutomationRuleRow | null> {
  if (!tableMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", ruleId)
        .maybeSingle();
      if (!error) {
        return (data ?? null) as AutomationRuleRow | null;
      }
      if (isMissingTableError(error)) {
        markTableMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err)) {
        markTableMissing();
      } else {
        throw err;
      }
    }
  }

  const row = store().get(ruleId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertAutomationRule(
  tenantId: string,
  input: Partial<AutomationRuleRow> & { name: string },
): Promise<AutomationRuleRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) {
        return data as AutomationRuleRow;
      }
      if (error && isMissingTableError(error)) {
        markTableMissing();
      } else if (error) {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err)) {
        markTableMissing();
      } else {
        throw err;
      }
    }
  }

  store().set(row.id, row);
  return row;
}

export async function deleteAutomationRule(
  ruleId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", ruleId);
      if (!error) return;
      if (isMissingTableError(error)) {
        markTableMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err)) {
        markTableMissing();
      } else {
        throw err;
      }
    }
  }

  const row = store().get(ruleId);
  if (row && row.tenant_id === tenantId) {
    store().delete(ruleId);
  }
}
