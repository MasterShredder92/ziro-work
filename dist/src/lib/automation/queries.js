import { listAutomationRules as listAutomationRulesRaw, upsertAutomationRule as upsertAutomationRuleRaw, deleteAutomationRule as deleteAutomationRuleRaw, getAutomationRule as getAutomationRuleRaw, } from "@data/automationRules";
function mapRow(row) {
    var _a;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        description: row.description,
        enabled: row.enabled,
        trigger: (_a = row.trigger) !== null && _a !== void 0 ? _a : {
            event: "lead.created",
        },
        conditions: Array.isArray(row.conditions)
            ? row.conditions
            : [],
        actions: Array.isArray(row.actions)
            ? row.actions
            : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
    };
}
export async function listAutomationRules(tenantId) {
    const rows = await listAutomationRulesRaw(tenantId);
    return rows.map(mapRow);
}
export async function getAutomationRule(ruleId, tenantId) {
    const row = await getAutomationRuleRaw(ruleId, tenantId);
    return row ? mapRow(row) : null;
}
export async function createAutomationRule(tenantId, data) {
    var _a, _b, _c, _d, _e;
    const row = await upsertAutomationRuleRaw(tenantId, {
        name: data.name,
        description: (_a = data.description) !== null && _a !== void 0 ? _a : null,
        enabled: (_b = data.enabled) !== null && _b !== void 0 ? _b : true,
        trigger: data.trigger,
        conditions: ((_c = data.conditions) !== null && _c !== void 0 ? _c : []),
        actions: ((_d = data.actions) !== null && _d !== void 0 ? _d : []),
        created_by: (_e = data.createdBy) !== null && _e !== void 0 ? _e : null,
    });
    return mapRow(row);
}
export async function updateAutomationRule(ruleId, tenantId, data) {
    var _a, _b, _c, _d, _e;
    const existing = await getAutomationRuleRaw(ruleId, tenantId);
    if (!existing) {
        throw new Error("AUTOMATION_RULE_NOT_FOUND");
    }
    const row = await upsertAutomationRuleRaw(tenantId, {
        id: existing.id,
        name: (_a = data.name) !== null && _a !== void 0 ? _a : existing.name,
        description: data.description === undefined ? existing.description : data.description,
        enabled: data.enabled === undefined ? existing.enabled : data.enabled,
        trigger: (_b = data.trigger) !== null && _b !== void 0 ? _b : existing.trigger,
        conditions: (_c = data.conditions) !== null && _c !== void 0 ? _c : existing.conditions,
        actions: (_d = data.actions) !== null && _d !== void 0 ? _d : existing.actions,
        created_at: existing.created_at,
        created_by: (_e = data.createdBy) !== null && _e !== void 0 ? _e : existing.created_by,
    });
    return mapRow(row);
}
export async function deleteAutomationRule(ruleId, tenantId) {
    await deleteAutomationRuleRaw(ruleId, tenantId);
}
