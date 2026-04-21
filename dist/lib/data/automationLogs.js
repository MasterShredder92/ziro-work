import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "automation_logs";
const g = globalThis;
function store() {
    if (!g.__ziro_automation_logs_store) {
        g.__ziro_automation_logs_store = new Map();
    }
    return g.__ziro_automation_logs_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `log_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        run_id: (_c = input.run_id) !== null && _c !== void 0 ? _c : null,
        workflow_id: (_d = input.workflow_id) !== null && _d !== void 0 ? _d : null,
        action_id: (_e = input.action_id) !== null && _e !== void 0 ? _e : null,
        level: ((_f = input.level) !== null && _f !== void 0 ? _f : "info"),
        message: String((_g = input.message) !== null && _g !== void 0 ? _g : ""),
        data: (_h = input.data) !== null && _h !== void 0 ? _h : null,
        created_at: (_j = input.created_at) !== null && _j !== void 0 ? _j : nowIso(),
    };
}
export async function listAutomationLogs(tenantId, filter, opts) {
    var _a, _b;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.runId)
                query = query.eq("run_id", filter.runId);
            if (filter === null || filter === void 0 ? void 0 : filter.workflowId)
                query = query.eq("workflow_id", filter.workflowId);
            if (filter === null || filter === void 0 ? void 0 : filter.actionId)
                query = query.eq("action_id", filter.actionId);
            if (filter === null || filter === void 0 ? void 0 : filter.level)
                query = query.eq("level", filter.level);
            query = applyListOptions(query.order("created_at", { ascending: true }), opts);
            const { data, error } = await query;
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
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
    let all = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.runId)
        all = all.filter((r) => r.run_id === filter.runId);
    if (filter === null || filter === void 0 ? void 0 : filter.workflowId)
        all = all.filter((r) => r.workflow_id === filter.workflowId);
    if (filter === null || filter === void 0 ? void 0 : filter.actionId)
        all = all.filter((r) => r.action_id === filter.actionId);
    if (filter === null || filter === void 0 ? void 0 : filter.level)
        all = all.filter((r) => r.level === filter.level);
    all.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (opts === null || opts === void 0 ? void 0 : opts.limit)
        all = all.slice((_a = opts.offset) !== null && _a !== void 0 ? _a : 0, ((_b = opts.offset) !== null && _b !== void 0 ? _b : 0) + opts.limit);
    return all;
}
export async function insertAutomationLog(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .insert(row)
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else if (error)
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
    return row;
}
