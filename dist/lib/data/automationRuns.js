import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "automation_runs";
const g = globalThis;
function store() {
    if (!g.__ziro_automation_runs_store) {
        g.__ziro_automation_runs_store = new Map();
    }
    return g.__ziro_automation_runs_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `run_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        workflow_id: String((_c = input.workflow_id) !== null && _c !== void 0 ? _c : ""),
        trigger_type: String((_d = input.trigger_type) !== null && _d !== void 0 ? _d : "custom.webhook"),
        status: ((_e = input.status) !== null && _e !== void 0 ? _e : "queued"),
        payload: ((_f = input.payload) !== null && _f !== void 0 ? _f : {}),
        steps: Array.isArray(input.steps) ? input.steps : [],
        logs: Array.isArray(input.logs)
            ? input.logs
            : [],
        attempt: typeof input.attempt === "number" ? input.attempt : 0,
        max_attempts: typeof input.max_attempts === "number" ? input.max_attempts : 3,
        started_at: (_g = input.started_at) !== null && _g !== void 0 ? _g : now,
        finished_at: (_h = input.finished_at) !== null && _h !== void 0 ? _h : null,
        duration_ms: typeof input.duration_ms === "number" ? input.duration_ms : null,
        error: (_j = input.error) !== null && _j !== void 0 ? _j : null,
        triggered_by: (_k = input.triggered_by) !== null && _k !== void 0 ? _k : null,
        created_at: (_l = input.created_at) !== null && _l !== void 0 ? _l : now,
        updated_at: (_m = input.updated_at) !== null && _m !== void 0 ? _m : now,
    };
}
export async function listAutomationRuns(tenantId, filter, opts) {
    var _a, _b;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.workflowId)
                query = query.eq("workflow_id", filter.workflowId);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.triggerType)
                query = query.eq("trigger_type", filter.triggerType);
            if (filter === null || filter === void 0 ? void 0 : filter.since)
                query = query.gte("created_at", filter.since);
            query = applyListOptions(query.order("created_at", { ascending: false }), opts);
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
    if (filter === null || filter === void 0 ? void 0 : filter.workflowId)
        all = all.filter((r) => r.workflow_id === filter.workflowId);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        all = all.filter((r) => r.status === filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.triggerType)
        all = all.filter((r) => r.trigger_type === filter.triggerType);
    if (filter === null || filter === void 0 ? void 0 : filter.since)
        all = all.filter((r) => r.created_at >= filter.since);
    all.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (opts === null || opts === void 0 ? void 0 : opts.limit)
        all = all.slice((_a = opts.offset) !== null && _a !== void 0 ? _a : 0, ((_b = opts.offset) !== null && _b !== void 0 ? _b : 0) + opts.limit);
    return all;
}
export async function getAutomationRun(runId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", runId)
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
    const row = store().get(runId);
    if (!row || row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAutomationRun(tenantId, input) {
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
export async function countRunningForTenant(tenantId) {
    const rows = await listAutomationRuns(tenantId, { status: "running" });
    return rows.length;
}
export async function countRunningForWorkflow(tenantId, workflowId) {
    const rows = await listAutomationRuns(tenantId, {
        status: "running",
        workflowId,
    });
    return rows.length;
}
