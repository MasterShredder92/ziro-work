import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "automation_workflows";
const g = globalThis;
function store() {
    if (!g.__ziro_automation_workflows_store) {
        g.__ziro_automation_workflows_store = new Map();
    }
    return g.__ziro_automation_workflows_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `wf_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        name: String((_c = input.name) !== null && _c !== void 0 ? _c : "Untitled workflow"),
        description: (_d = input.description) !== null && _d !== void 0 ? _d : null,
        status: ((_e = input.status) !== null && _e !== void 0 ? _e : "draft"),
        trigger: (_f = input.trigger) !== null && _f !== void 0 ? _f : {
            type: "custom.webhook",
        },
        actions: Array.isArray(input.actions) ? input.actions : [],
        concurrency_limit: typeof input.concurrency_limit === "number"
            ? input.concurrency_limit
            : null,
        retry_max: typeof input.retry_max === "number" ? input.retry_max : 3,
        retry_backoff_ms: typeof input.retry_backoff_ms === "number"
            ? input.retry_backoff_ms
            : 1000,
        tags: Array.isArray(input.tags) ? input.tags : [],
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: (_h = input.updated_at) !== null && _h !== void 0 ? _h : now,
        created_by: (_j = input.created_by) !== null && _j !== void 0 ? _j : null,
        last_run_at: (_k = input.last_run_at) !== null && _k !== void 0 ? _k : null,
        last_run_status: (_l = input.last_run_status) !== null && _l !== void 0 ? _l : null,
    };
}
export async function listAutomationWorkflows(tenantId, filter, opts) {
    var _a, _b;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.triggerType)
                query = query.contains("trigger", { type: filter.triggerType });
            if (filter === null || filter === void 0 ? void 0 : filter.tag)
                query = query.contains("tags", [filter.tag]);
            if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim().length > 0) {
                query = query.ilike("name", `%${filter.search.trim()}%`);
            }
            query = applyListOptions(query.order("updated_at", { ascending: false }), opts);
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
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        all = all.filter((r) => r.status === filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.triggerType)
        all = all.filter((r) => { var _a; return ((_a = r.trigger) === null || _a === void 0 ? void 0 : _a.type) === filter.triggerType; });
    if (filter === null || filter === void 0 ? void 0 : filter.tag)
        all = all.filter((r) => r.tags.includes(filter.tag));
    if (filter === null || filter === void 0 ? void 0 : filter.search) {
        const q = filter.search.toLowerCase();
        all = all.filter((r) => r.name.toLowerCase().includes(q));
    }
    all.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (opts === null || opts === void 0 ? void 0 : opts.limit)
        all = all.slice((_a = opts.offset) !== null && _a !== void 0 ? _a : 0, ((_b = opts.offset) !== null && _b !== void 0 ? _b : 0) + opts.limit);
    return all;
}
export async function getAutomationWorkflow(workflowId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", workflowId)
                .maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
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
    const row = store().get(workflowId);
    if (!row || row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAutomationWorkflow(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
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
export async function deleteAutomationWorkflow(workflowId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", workflowId);
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
    const row = store().get(workflowId);
    if (row && row.tenant_id === tenantId)
        store().delete(workflowId);
}
export async function updateWorkflowRunMetadata(workflowId, tenantId, lastRunAt, lastRunStatus) {
    const existing = await getAutomationWorkflow(workflowId, tenantId);
    if (!existing)
        return;
    await upsertAutomationWorkflow(tenantId, Object.assign(Object.assign({}, existing), { last_run_at: lastRunAt, last_run_status: lastRunStatus }));
}
