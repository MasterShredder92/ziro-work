import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "assessment_rubric_criteria";
const g = globalThis;
function store() {
    if (!g.__ziro_assessment_rubric_store)
        g.__ziro_assessment_rubric_store = new Map();
    return g.__ziro_assessment_rubric_store;
}
export async function listAssessmentRubric(assessmentId, tenantId, opts) {
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
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
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
export async function upsertAssessmentRubricCriterion(tenantId, input) {
    var _a, _b, _c;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `rc_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
        tenant_id: tenantId,
        assessment_id: input.assessment_id,
        criterion: input.criterion,
        description: (_b = input.description) !== null && _b !== void 0 ? _b : null,
        max_points: typeof input.max_points === "number" ? input.max_points : 4,
        weight: typeof input.weight === "number" ? input.weight : 1,
        levels: Array.isArray(input.levels) ? input.levels : [],
        sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
        created_at: (_c = input.created_at) !== null && _c !== void 0 ? _c : now,
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
