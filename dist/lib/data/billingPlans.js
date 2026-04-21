import { applyListOptions, clientFor } from "./_client";
const TABLE = "billing_plans";
export async function listBillingPlans(tenantId, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (opts === null || opts === void 0 ? void 0 : opts.activeOnly)
        query = query.eq("active", true);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getBillingPlanById(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function createBillingPlan(tenantId, input) {
    const supabase = clientFor(tenantId);
    const payload = Object.assign(Object.assign({ kind: "fixed", interval: "month", interval_count: 1, currency: "USD", tax_rate_bp: 0, active: true }, input), { tenant_id: tenantId });
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateBillingPlan(id, tenantId, patch) {
    const supabase = clientFor(tenantId);
    const body = Object.assign(Object.assign({}, patch), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from(TABLE)
        .update(body)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteBillingPlan(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
