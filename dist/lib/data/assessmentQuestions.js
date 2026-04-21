import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "assessment_questions";
const g = globalThis;
function store() {
    if (!g.__ziro_assessment_questions_store)
        g.__ziro_assessment_questions_store = new Map();
    return g.__ziro_assessment_questions_store;
}
export async function listAssessmentQuestions(assessmentId, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase
                .from(TABLE)
                .select("*")
                .eq("assessment_id", assessmentId);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
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
        .filter((r) => r.assessment_id === assessmentId)
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .sort((a, b) => { var _a, _b; return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0); });
}
export async function upsertAssessmentQuestion(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `q_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
        tenant_id: tenantId,
        assessment_id: input.assessment_id,
        section_id: (_b = input.section_id) !== null && _b !== void 0 ? _b : null,
        prompt: input.prompt,
        kind: input.kind,
        options: Array.isArray(input.options) ? input.options : [],
        points: typeof input.points === "number" ? input.points : 1,
        rubric_criterion_id: (_c = input.rubric_criterion_id) !== null && _c !== void 0 ? _c : null,
        difficulty: (_d = input.difficulty) !== null && _d !== void 0 ? _d : null,
        sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
        correct_answer: (_e = input.correct_answer) !== null && _e !== void 0 ? _e : null,
        explanation: (_f = input.explanation) !== null && _f !== void 0 ? _f : null,
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: now,
    };
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
