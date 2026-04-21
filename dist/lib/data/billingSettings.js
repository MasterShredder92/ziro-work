import { clientFor } from "./_client";
const TABLE = "billing_settings";
export async function getBillingSettings(tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function upsertBillingSettings(tenantId, patch) {
    const supabase = clientFor(tenantId);
    const body = Object.assign(Object.assign({ tenant_id: tenantId }, patch), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from(TABLE)
        .upsert(body, { onConflict: "tenant_id" })
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function incrementInvoiceSequence(tenantId) {
    var _a;
    const current = await getBillingSettings(tenantId);
    const next = ((_a = current === null || current === void 0 ? void 0 : current.invoice_next_number) !== null && _a !== void 0 ? _a : 1001) + 1;
    return upsertBillingSettings(tenantId, {
        invoice_next_number: next,
    });
}
