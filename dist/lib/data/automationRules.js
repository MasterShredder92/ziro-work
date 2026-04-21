import { clientFor } from "./_client";
const TABLE = "automation_rules";
const g = globalThis;
function store() {
    if (!g.__ziro_automation_rules_store) {
        g.__ziro_automation_rules_store = new Map();
    }
    return g.__ziro_automation_rules_store;
}
function tableMissing() {
    return g.__ziro_automation_rules_db_missing === true;
}
function markTableMissing() {
    g.__ziro_automation_rules_db_missing = true;
}
function isMissingTableError(err) {
    if (!err || typeof err !== "object")
        return false;
    const rec = err;
    const code = typeof rec.code === "string" ? rec.code : null;
    const message = typeof rec.message === "string" ? rec.message : "";
    if (code === "42P01")
        return true;
    if (code === "PGRST205")
        return true;
    if (/relation .*automation_rules.* does not exist/i.test(message))
        return true;
    if (/Could not find the table .*automation_rules/i.test(message))
        return true;
    return false;
}
function newId() {
    return `auto_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        name: String((_c = input.name) !== null && _c !== void 0 ? _c : "Untitled automation"),
        description: (_d = input.description) !== null && _d !== void 0 ? _d : null,
        enabled: input.enabled !== false,
        trigger: ((_e = input.trigger) !== null && _e !== void 0 ? _e : {}),
        conditions: Array.isArray(input.conditions)
            ? input.conditions
            : [],
        actions: Array.isArray(input.actions) ? input.actions : [],
        created_at: (_f = input.created_at) !== null && _f !== void 0 ? _f : now,
        updated_at: (_g = input.updated_at) !== null && _g !== void 0 ? _g : now,
        created_by: (_h = input.created_by) !== null && _h !== void 0 ? _h : null,
    };
}
export async function listAutomationRules(tenantId) {
    if (!tableMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .order("updated_at", { ascending: false });
            if (!error) {
                return (data !== null && data !== void 0 ? data : []);
            }
            if (isMissingTableError(error)) {
                markTableMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err)) {
                markTableMissing();
            }
            else {
                throw err;
            }
        }
    }
    const all = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    return all.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getAutomationRule(ruleId, tenantId) {
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
                return (data !== null && data !== void 0 ? data : null);
            }
            if (isMissingTableError(error)) {
                markTableMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err)) {
                markTableMissing();
            }
            else {
                throw err;
            }
        }
    }
    const row = store().get(ruleId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAutomationRule(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data) {
                return data;
            }
            if (error && isMissingTableError(error)) {
                markTableMissing();
            }
            else if (error) {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err)) {
                markTableMissing();
            }
            else {
                throw err;
            }
        }
    }
    store().set(row.id, row);
    return row;
}
export async function deleteAutomationRule(ruleId, tenantId) {
    if (!tableMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", ruleId);
            if (!error)
                return;
            if (isMissingTableError(error)) {
                markTableMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err)) {
                markTableMissing();
            }
            else {
                throw err;
            }
        }
    }
    const row = store().get(ruleId);
    if (row && row.tenant_id === tenantId) {
        store().delete(ruleId);
    }
}
