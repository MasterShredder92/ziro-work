import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "lesson_plan_versions";
const g = globalThis;
function store() {
    if (!g.__ziro_lesson_plan_versions_store)
        g.__ziro_lesson_plan_versions_store = new Map();
    return g.__ziro_lesson_plan_versions_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `lpv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        plan_id: input.plan_id,
        version: input.version,
        label: (_c = input.label) !== null && _c !== void 0 ? _c : null,
        summary: (_d = input.summary) !== null && _d !== void 0 ? _d : null,
        source: ((_e = input.source) !== null && _e !== void 0 ? _e : "manual"),
        author_id: (_f = input.author_id) !== null && _f !== void 0 ? _f : null,
        ai_prompt: (_g = input.ai_prompt) !== null && _g !== void 0 ? _g : null,
        ai_model: (_h = input.ai_model) !== null && _h !== void 0 ? _h : null,
        ai_metadata: input.ai_metadata && typeof input.ai_metadata === "object"
            ? input.ai_metadata
            : {},
        snapshot: input.snapshot && typeof input.snapshot === "object"
            ? input.snapshot
            : {},
        created_at: (_j = input.created_at) !== null && _j !== void 0 ? _j : now,
    };
}
export async function listLessonPlanVersions(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.plan_id)
                query = query.eq("plan_id", filter.plan_id);
            if (filter.source)
                query = query.eq("source", filter.source);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "version",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
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
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .filter((r) => (filter.plan_id ? r.plan_id === filter.plan_id : true))
        .filter((r) => (filter.source ? r.source === filter.source : true))
        .sort((a, b) => b.version - a.version);
}
export async function upsertLessonPlanVersion(tenantId, input) {
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
