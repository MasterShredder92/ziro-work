import { applyListOptions, clientFor } from "./_client";
const TABLE = "invoice_line_items";
export async function listLineItems(tenantId, invoiceId, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    const query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("invoice_id", invoiceId);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function createLineItem(tenantId, input) {
    var _a, _b, _c, _d, _e;
    const supabase = clientFor(tenantId);
    const qty = (_a = input.quantity) !== null && _a !== void 0 ? _a : 1;
    const unit = (_b = input.unit_amount_cents) !== null && _b !== void 0 ? _b : 0;
    const amount = (_c = input.amount_cents) !== null && _c !== void 0 ? _c : Math.round(qty * unit);
    const payload = Object.assign(Object.assign({ kind: "line", quantity: qty, unit_amount_cents: unit, amount_cents: amount, taxable: (_d = input.taxable) !== null && _d !== void 0 ? _d : false, sort_order: (_e = input.sort_order) !== null && _e !== void 0 ? _e : 0 }, input), { tenant_id: tenantId });
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function createLineItemsBulk(tenantId, items) {
    if (items.length === 0)
        return [];
    const supabase = clientFor(tenantId);
    const rows = items.map((item) => {
        var _a, _b, _c;
        const qty = (_a = item.quantity) !== null && _a !== void 0 ? _a : 1;
        const unit = (_b = item.unit_amount_cents) !== null && _b !== void 0 ? _b : 0;
        const amount = (_c = item.amount_cents) !== null && _c !== void 0 ? _c : Math.round(qty * unit);
        return Object.assign(Object.assign({ kind: "line", taxable: false, sort_order: 0 }, item), { quantity: qty, unit_amount_cents: unit, amount_cents: amount, tenant_id: tenantId });
    });
    const { data, error } = await supabase.from(TABLE).insert(rows).select("*");
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function updateLineItem(id, tenantId, patch) {
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
export async function deleteLineItem(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function deleteLineItemsForInvoice(invoiceId, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("invoice_id", invoiceId);
    if (error)
        throw error;
}
