import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "lesson_plans";
const g = globalThis;
function store() {
    if (!g.__ziro_lesson_plans_store)
        g.__ziro_lesson_plans_store = new Map();
    return g.__ziro_lesson_plans_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `lp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function toStringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((v) => typeof v === "string");
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        title: String((_c = input.title) !== null && _c !== void 0 ? _c : "Untitled lesson plan"),
        summary: (_d = input.summary) !== null && _d !== void 0 ? _d : null,
        subject: (_e = input.subject) !== null && _e !== void 0 ? _e : null,
        grade_level: (_f = input.grade_level) !== null && _f !== void 0 ? _f : null,
        duration_minutes: (_g = input.duration_minutes) !== null && _g !== void 0 ? _g : null,
        program_id: (_h = input.program_id) !== null && _h !== void 0 ? _h : null,
        unit_id: (_j = input.unit_id) !== null && _j !== void 0 ? _j : null,
        lesson_id: (_k = input.lesson_id) !== null && _k !== void 0 ? _k : null,
        level_id: (_l = input.level_id) !== null && _l !== void 0 ? _l : null,
        teacher_id: (_m = input.teacher_id) !== null && _m !== void 0 ? _m : null,
        author_id: (_o = input.author_id) !== null && _o !== void 0 ? _o : null,
        status: ((_p = input.status) !== null && _p !== void 0 ? _p : "draft"),
        source: ((_q = input.source) !== null && _q !== void 0 ? _q : "manual"),
        curriculum_alignment: toStringArray(input.curriculum_alignment),
        standards: toStringArray(input.standards),
        current_version: typeof input.current_version === "number" ? input.current_version : 1,
        last_ai_draft_at: (_r = input.last_ai_draft_at) !== null && _r !== void 0 ? _r : null,
        tags: toStringArray(input.tags),
        created_at: (_s = input.created_at) !== null && _s !== void 0 ? _s : now,
        updated_at: (_t = input.updated_at) !== null && _t !== void 0 ? _t : now,
    };
}
export async function listLessonPlans(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
                query = query.eq("teacher_id", filter.teacher_id);
            if (filter === null || filter === void 0 ? void 0 : filter.program_id)
                query = query.eq("program_id", filter.program_id);
            if (filter === null || filter === void 0 ? void 0 : filter.unit_id)
                query = query.eq("unit_id", filter.unit_id);
            if (filter === null || filter === void 0 ? void 0 : filter.lesson_id)
                query = query.eq("lesson_id", filter.lesson_id);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
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
        .filter((r) => r.tenant_id === tenantId)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.status) ? r.status === filter.status : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.teacher_id) ? r.teacher_id === filter.teacher_id : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.program_id) ? r.program_id === filter.program_id : true)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.unit_id) ? r.unit_id === filter.unit_id : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.lesson_id) ? r.lesson_id === filter.lesson_id : true)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getLessonPlan(planId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", planId);
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
    const row = (_a = store().get(planId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertLessonPlan(tenantId, input) {
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
