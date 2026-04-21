import { clientFor, applyListOptions } from "./_client";
const TABLE = "student_followups";
export async function listStudentFollowups(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.student_id)
        query = query.eq("student_id", filter.student_id);
    if (filter === null || filter === void 0 ? void 0 : filter.family_id)
        query = query.eq("family_id", filter.family_id);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.reason)
        query = query.eq("reason", filter.reason);
    if (filter === null || filter === void 0 ? void 0 : filter.due_from)
        query = query.gte("followup_date", filter.due_from);
    if (filter === null || filter === void 0 ? void 0 : filter.due_to)
        query = query.lte("followup_date", filter.due_to);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "followup_date",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 100,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getStudentFollowupById(id, tenantId) {
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
export async function createStudentFollowup(tenantId, input) {
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
export async function updateStudentFollowup(id, tenantId, input) {
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
export async function markStudentFollowupSent(id, tenantId, sentBy) {
    return updateStudentFollowup(id, tenantId, {
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_by: sentBy,
    });
}
export async function deleteStudentFollowup(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
