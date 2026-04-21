import { applyListOptions, clientFor } from "./_client";
const TABLE = "usage_records";
export async function recordUsage(tenantId, input) {
    const supabase = clientFor(tenantId);
    const payload = Object.assign({ tenant_id: tenantId, timestamp: new Date().toISOString(), source: "system", metadata: {} }, input);
    const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
    if (error)
        throw error;
    return data;
}
export async function listUsageRecords(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.metric)
        query = query.eq("metric", filter.metric);
    if (filter === null || filter === void 0 ? void 0 : filter.from)
        query = query.gte("timestamp", filter.from);
    if (filter === null || filter === void 0 ? void 0 : filter.to)
        query = query.lte("timestamp", filter.to);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "timestamp",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
