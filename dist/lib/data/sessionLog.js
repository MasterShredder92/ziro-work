import { clientFor, applyListOptions } from "./_client";
const TABLE = "session_log";
export async function listSessionLog(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.student_id)
        query = query.eq("student_id", filter.student_id);
    if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
        query = query.eq("teacher_id", filter.teacher_id);
    if (filter === null || filter === void 0 ? void 0 : filter.schedule_block_id)
        query = query.eq("schedule_block_id", filter.schedule_block_id);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id)
        query = query.eq("location_id", filter.location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.date_from)
        query = query.gte("block_date", filter.date_from);
    if (filter === null || filter === void 0 ? void 0 : filter.date_to)
        query = query.lte("block_date", filter.date_to);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "block_date",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getSessionLogById(id, tenantId) {
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
export async function getSessionLogByBlockId(scheduleBlockId, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("schedule_block_id", scheduleBlockId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function createSessionLog(tenantId, input) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .insert(Object.assign(Object.assign({}, input), { tenant_id: tenantId }))
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateSessionLog(id, tenantId, input) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .update(input)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteSessionLog(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
