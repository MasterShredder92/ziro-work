import { applyListOptions, clientFor } from "./_client";
const TABLE = "payments";
export async function listPayments(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.invoice_id)
        query = query.eq("invoice_id", filter.invoice_id);
    if (filter === null || filter === void 0 ? void 0 : filter.family_id)
        query = query.eq("family_id", filter.family_id);
    if (filter === null || filter === void 0 ? void 0 : filter.student_id)
        query = query.eq("student_id", filter.student_id);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.paid_after)
        query = query.gte("paid_at", filter.paid_after);
    if (filter === null || filter === void 0 ? void 0 : filter.paid_before)
        query = query.lte("paid_at", filter.paid_before);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "paid_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getPaymentById(id, tenantId) {
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
export async function createPayment(tenantId, input) {
    const supabase = clientFor(tenantId);
    const payload = Object.assign(Object.assign({ currency: "USD", method: "manual", status: "succeeded", refunded_cents: 0, paid_at: new Date().toISOString() }, input), { tenant_id: tenantId });
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updatePayment(id, tenantId, patch) {
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
export async function deletePayment(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
