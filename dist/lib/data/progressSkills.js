import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "progress_skills";
const g = globalThis;
function store() {
    if (!g.__ziro_progress_skills_store)
        g.__ziro_progress_skills_store = new Map();
    return g.__ziro_progress_skills_store;
}
export async function listSkills(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.goal_id)
                query = query.eq("goal_id", filter.goal_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 1000,
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
        .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .sort((a, b) => {
        var _a, _b;
        return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0) ||
            a.created_at.localeCompare(b.created_at);
    });
}
export async function upsertSkill(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        goal_id: input.goal_id,
        student_id: input.student_id,
        title: input.title,
        description: (_b = input.description) !== null && _b !== void 0 ? _b : null,
        rubric: (_c = input.rubric) !== null && _c !== void 0 ? _c : null,
        status: (_d = input.status) !== null && _d !== void 0 ? _d : "not_started",
        mastery_score: (_e = input.mastery_score) !== null && _e !== void 0 ? _e : null,
        teacher_id: (_f = input.teacher_id) !== null && _f !== void 0 ? _f : null,
        mastered_at: (_g = input.mastered_at) !== null && _g !== void 0 ? _g : null,
        sort_order: (_h = input.sort_order) !== null && _h !== void 0 ? _h : 0,
        created_at: (_j = input.created_at) !== null && _j !== void 0 ? _j : now,
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
