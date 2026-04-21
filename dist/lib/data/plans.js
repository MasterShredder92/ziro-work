import { applyListOptions, clientFor } from "./_client";
const TABLE = "plans";
export async function listPlans(tenantId, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (opts === null || opts === void 0 ? void 0 : opts.activeOnly)
        query = query.eq("is_active", true);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 100,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getPlanById(tenantId, planId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", planId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function createPlan(tenantId, input) {
    const supabase = clientFor(tenantId);
    const payload = Object.assign(Object.assign({ price_monthly: 0, price_yearly: 0, limits: {}, is_active: true, metadata: {} }, input), { tenant_id: tenantId });
    const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
    if (error)
        throw error;
    return data;
}
export async function updatePlan(tenantId, planId, patch) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .update(Object.assign(Object.assign({}, patch), { updated_at: new Date().toISOString() }))
        .eq("tenant_id", tenantId)
        .eq("id", planId)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
