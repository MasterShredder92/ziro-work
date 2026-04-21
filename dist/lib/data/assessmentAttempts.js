import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "assessment_attempts";
const g = globalThis;
function store() {
    if (!g.__ziro_assessment_attempts_store)
        g.__ziro_assessment_attempts_store = new Map();
    return g.__ziro_assessment_attempts_store;
}
function nowIso() {
    return new Date().toISOString();
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const now = nowIso();
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : `att_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        assessment_id: String((_c = input.assessment_id) !== null && _c !== void 0 ? _c : ""),
        student_id: String((_d = input.student_id) !== null && _d !== void 0 ? _d : ""),
        teacher_id: (_e = input.teacher_id) !== null && _e !== void 0 ? _e : null,
        status: ((_f = input.status) !== null && _f !== void 0 ? _f : "in_progress"),
        score: (_g = input.score) !== null && _g !== void 0 ? _g : null,
        max_score: (_h = input.max_score) !== null && _h !== void 0 ? _h : null,
        passed: (_j = input.passed) !== null && _j !== void 0 ? _j : null,
        answers: Array.isArray(input.answers) ? input.answers : [],
        rubric_totals: (_k = input.rubric_totals) !== null && _k !== void 0 ? _k : {},
        feedback: (_l = input.feedback) !== null && _l !== void 0 ? _l : null,
        started_at: (_m = input.started_at) !== null && _m !== void 0 ? _m : now,
        submitted_at: (_o = input.submitted_at) !== null && _o !== void 0 ? _o : null,
        graded_at: (_p = input.graded_at) !== null && _p !== void 0 ? _p : null,
        graded_by: (_q = input.graded_by) !== null && _q !== void 0 ? _q : null,
        duration_seconds: (_r = input.duration_seconds) !== null && _r !== void 0 ? _r : null,
        created_at: (_s = input.created_at) !== null && _s !== void 0 ? _s : now,
        updated_at: now,
    };
}
export async function listAssessmentAttempts(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.assessment_id)
                query = query.eq("assessment_id", filter.assessment_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.teacher_id)
                query = query.eq("teacher_id", filter.teacher_id);
            if (filter.status)
                query = query.eq("status", filter.status);
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
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .filter((r) => filter.assessment_id ? r.assessment_id === filter.assessment_id : true)
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getAssessmentAttempt(attemptId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", attemptId);
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
    const row = (_a = store().get(attemptId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAssessmentAttempt(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
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
