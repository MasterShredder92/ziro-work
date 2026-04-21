import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "recurring_rules";
const g = globalThis;
function store() {
    if (!g.__ziro_recurring_rules_store)
        g.__ziro_recurring_rules_store = new Map();
    return g.__ziro_recurring_rules_store;
}
function rowToRule(r) {
    var _a;
    return {
        id: r.id,
        tenantId: r.tenant_id,
        frequency: r.frequency,
        interval: r.interval,
        byWeekday: r.by_weekday,
        startDate: r.start_date,
        endDate: r.end_date,
        count: r.count,
        exceptions: (_a = r.exceptions) !== null && _a !== void 0 ? _a : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function ruleToRow(tenantId, input) {
    var _a, _b, _c, _d, _e;
    const now = new Date().toISOString();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `rec_${Math.random().toString(36).slice(2, 10)}`,
        tenant_id: tenantId,
        frequency: input.frequency,
        interval: input.interval,
        by_weekday: (_b = input.byWeekday) !== null && _b !== void 0 ? _b : null,
        start_date: input.startDate,
        end_date: (_c = input.endDate) !== null && _c !== void 0 ? _c : null,
        count: (_d = input.count) !== null && _d !== void 0 ? _d : null,
        exceptions: (_e = input.exceptions) !== null && _e !== void 0 ? _e : [],
        created_at: now,
        updated_at: now,
    };
}
export async function listRecurringRules(tenantId, opts) {
    var _a, _b, _c, _d;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "start_date",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return ((_d = data) !== null && _d !== void 0 ? _d : []).map(rowToRule);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    return Array.from(store().values())
        .filter((r) => r.tenant_id === tenantId)
        .sort((a, b) => (a.start_date < b.start_date ? -1 : 1))
        .map(rowToRule);
}
export async function getRecurringRule(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .maybeSingle();
            if (!error)
                return data ? rowToRule(data) : null;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const r = store().get(id);
    if (!r || r.tenant_id !== tenantId)
        return null;
    return rowToRule(r);
}
export async function createRecurringRule(tenantId, input) {
    const row = ruleToRow(tenantId, input);
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .insert(row)
                .select("*")
                .single();
            if (!error)
                return rowToRule(data);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    store().set(row.id, row);
    return rowToRule(row);
}
export async function updateRecurringRule(id, tenantId, patch) {
    const now = new Date().toISOString();
    const update = { updated_at: now };
    if (patch.frequency !== undefined)
        update.frequency = patch.frequency;
    if (patch.interval !== undefined)
        update.interval = patch.interval;
    if (patch.byWeekday !== undefined)
        update.by_weekday = patch.byWeekday;
    if (patch.startDate !== undefined)
        update.start_date = patch.startDate;
    if (patch.endDate !== undefined)
        update.end_date = patch.endDate;
    if (patch.count !== undefined)
        update.count = patch.count;
    if (patch.exceptions !== undefined)
        update.exceptions = patch.exceptions;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .update(update)
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .select("*")
                .single();
            if (!error)
                return rowToRule(data);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) {
        throw new Error(`recurring_rule ${id} not found`);
    }
    const next = Object.assign(Object.assign({}, existing), update);
    store().set(id, next);
    return rowToRule(next);
}
export async function deleteRecurringRule(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", id);
            if (!error)
                return;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const r = store().get(id);
    if (r && r.tenant_id === tenantId)
        store().delete(id);
}
