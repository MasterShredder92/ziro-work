import {
  listAutomationRules as listAutomationRulesRaw,
  upsertAutomationRule as upsertAutomationRuleRaw,
  deleteAutomationRule as deleteAutomationRuleRaw,
  getAutomationRule as getAutomationRuleRaw,
  type AutomationRuleRow,
} from "@data/automationRules";
import type {
  AutomationAction,
  AutomationCondition,
  AutomationRule,
  AutomationRuleInput,
  AutomationTrigger,
} from "./types";

function mapRow(row: AutomationRuleRow): AutomationRule {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    trigger: (row.trigger as unknown as AutomationTrigger) ?? {
      event: "lead.created",
    },
    conditions: Array.isArray(row.conditions)
      ? (row.conditions as unknown as AutomationCondition[])
      : [],
    actions: Array.isArray(row.actions)
      ? (row.actions as unknown as AutomationAction[])
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export async function listAutomationRules(
  tenantId: string,
): Promise<AutomationRule[]> {
  const rows = await listAutomationRulesRaw(tenantId);
  return rows.map(mapRow);
}

export async function getAutomationRule(
  ruleId: string,
  tenantId: string,
): Promise<AutomationRule | null> {
  const row = await getAutomationRuleRaw(ruleId, tenantId);
  return row ? mapRow(row) : null;
}

export async function createAutomationRule(
  tenantId: string,
  data: AutomationRuleInput,
): Promise<AutomationRule> {
  const row = await upsertAutomationRuleRaw(tenantId, {
    name: data.name,
    description: data.description ?? null,
    enabled: data.enabled ?? true,
    trigger: data.trigger as unknown as Record<string, unknown>,
    conditions:
      (data.conditions ?? []) as unknown as Array<Record<string, unknown>>,
    actions: (data.actions ?? []) as unknown as Array<Record<string, unknown>>,
    created_by: data.createdBy ?? null,
  });
  return mapRow(row);
}

export async function updateAutomationRule(
  ruleId: string,
  tenantId: string,
  data: Partial<AutomationRuleInput>,
): Promise<AutomationRule> {
  const existing = await getAutomationRuleRaw(ruleId, tenantId);
  if (!existing) {
    throw new Error("AUTOMATION_RULE_NOT_FOUND");
  }
  const row = await upsertAutomationRuleRaw(tenantId, {
    id: existing.id,
    name: data.name ?? existing.name,
    description:
      data.description === undefined ? existing.description : data.description,
    enabled: data.enabled === undefined ? existing.enabled : data.enabled,
    trigger:
      (data.trigger as unknown as Record<string, unknown>) ?? existing.trigger,
    conditions:
      (data.conditions as unknown as Array<Record<string, unknown>>) ??
      existing.conditions,
    actions:
      (data.actions as unknown as Array<Record<string, unknown>>) ??
      existing.actions,
    created_at: existing.created_at,
    created_by: data.createdBy ?? existing.created_by,
  });
  return mapRow(row);
}

export async function deleteAutomationRule(
  ruleId: string,
  tenantId: string,
): Promise<void> {
  await deleteAutomationRuleRaw(ruleId, tenantId);
}
