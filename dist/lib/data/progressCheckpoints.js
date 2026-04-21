import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "progress_checkpoints";
const g = globalThis;
function store() {
    if (!g.__ziro_progress_checkpoints_store)
        g.__ziro_progress_checkpoints_store = new Map();
    return g.__ziro_progress_checkpoints_store;
}
export async function listCheckpoints(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.skill_id)
                query = query.eq("skill_id", filter.skill_id);
            if (filter.goal_id)
                query = query.eq("goal_id", filter.goal_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 2000,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
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
    return Array.from(store().values())
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .filter((r) => (filter.skill_id ? r.skill_id === filter.skill_id : true))
        .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .sort((a, b) => {
        var _a, _b;
        return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0) ||
            a.created_at.localeCompare(b.created_at);
    });
}
export async function getCheckpointById(id, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", id);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { data, error } = await query.maybeSingle();
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
    const row = (_a = store().get(id)) !== null && _a !== void 0 ? _a : null;
    if (row && tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertCheckpoint(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        skill_id: input.skill_id,
        goal_id: (_b = input.goal_id) !== null && _b !== void 0 ? _b : null,
        student_id: input.student_id,
        title: input.title,
        description: (_c = input.description) !== null && _c !== void 0 ? _c : null,
        status: (_d = input.status) !== null && _d !== void 0 ? _d : "pending",
        score: (_e = input.score) !== null && _e !== void 0 ? _e : null,
        teacher_id: (_f = input.teacher_id) !== null && _f !== void 0 ? _f : null,
        teacher_feedback: (_g = input.teacher_feedback) !== null && _g !== void 0 ? _g : null,
        scored_at: (_h = input.scored_at) !== null && _h !== void 0 ? _h : null,
        due_date: (_j = input.due_date) !== null && _j !== void 0 ? _j : null,
        sort_order: (_k = input.sort_order) !== null && _k !== void 0 ? _k : 0,
        created_at: (_l = input.created_at) !== null && _l !== void 0 ? _l : now,
        updated_at: now,
    };
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(input.tenant_id);
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
