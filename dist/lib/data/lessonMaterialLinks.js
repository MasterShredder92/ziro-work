import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "lesson_plan_material_links";
const g = globalThis;
function store() {
    if (!g.__ziro_lesson_material_links_store)
        g.__ziro_lesson_material_links_store = new Map();
    return g.__ziro_lesson_material_links_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `lpm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        plan_id: input.plan_id,
        material_id: (_c = input.material_id) !== null && _c !== void 0 ? _c : null,
        title: input.title,
        url: (_d = input.url) !== null && _d !== void 0 ? _d : null,
        kind: ((_e = input.kind) !== null && _e !== void 0 ? _e : "link"),
        notes: (_f = input.notes) !== null && _f !== void 0 ? _f : null,
        is_required: Boolean(input.is_required),
        sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: now,
    };
}
export async function listLessonMaterialLinks(planId, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("plan_id", planId);
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
        .filter((r) => r.plan_id === planId)
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .sort((a, b) => a.sort_order - b.sort_order);
}
export async function upsertLessonMaterialLink(tenantId, input) {
    const row = normalize(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
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
