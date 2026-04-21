import { applyListOptions, clientFor } from "./_client";
const TABLE = "discounts";
export async function listDiscounts(tenantId, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
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
export async function createDiscount(tenantId, input) {
    const supabase = clientFor(tenantId);
    const payload = Object.assign(Object.assign({ kind: "percent", applies_to: "invoice", active: true }, input), { tenant_id: tenantId });
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateDiscount(id, tenantId, patch) {
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
export async function deleteDiscount(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
