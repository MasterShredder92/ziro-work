import { clientFor, applyListOptions } from "./_client";
const TABLE = "schedule_blocks";
export async function listScheduleBlocks(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
        query = query.eq("teacher_id", filter.teacher_id);
    if (filter === null || filter === void 0 ? void 0 : filter.student_id)
        query = query.eq("student_id", filter.student_id);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id)
        query = query.eq("location_id", filter.location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.room_id)
        query = query.eq("room_id", filter.room_id);
    if (filter === null || filter === void 0 ? void 0 : filter.block_type)
        query = query.eq("block_type", filter.block_type);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
    if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_recurring) === "boolean")
        query = query.eq("is_recurring", filter.is_recurring);
    if (filter === null || filter === void 0 ? void 0 : filter.date_from)
        query = query.gte("block_date", filter.date_from);
    if (filter === null || filter === void 0 ? void 0 : filter.date_to)
        query = query.lte("block_date", filter.date_to);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "block_date",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getScheduleBlockById(id, tenantId) {
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
export async function createScheduleBlock(tenantId, input) {
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
export async function updateScheduleBlock(id, tenantId, input) {
    const supabase = clientFor(tenantId);
    const patch = Object.assign(Object.assign({}, input), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteScheduleBlock(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function findConflictingBlocks(tenantId, teacherId, blockDate, startTime, endTime, excludeBlockId) {
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacherId)
        .eq("block_date", blockDate)
        .lt("start_time", endTime)
        .gt("end_time", startTime);
    if (excludeBlockId)
        query = query.neq("id", excludeBlockId);
    const { data, error } = await query;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
