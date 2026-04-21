import { clientFor, applyListOptions } from "./_client";
const TABLE = "leads";
export async function listLeads(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.stage)
        query = query.eq("stage", filter.stage);
    if (filter === null || filter === void 0 ? void 0 : filter.assigned_to)
        query = query.eq("assigned_to", filter.assigned_to);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id)
        query = query.eq("location_id", filter.location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.source)
        query = query.eq("source", filter.source);
    if (filter === null || filter === void 0 ? void 0 : filter.intake_submission_id)
        query = query.eq("intake_submission_id", filter.intake_submission_id);
    if ((filter === null || filter === void 0 ? void 0 : filter.converted_student_id) === null)
        query = query.is("converted_student_id", null);
    else if (filter === null || filter === void 0 ? void 0 : filter.converted_student_id)
        query = query.eq("converted_student_id", filter.converted_student_id);
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
export async function getLeadById(id, tenantId) {
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
export async function createLead(tenantId, input) {
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
export async function updateLead(id, tenantId, input) {
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
export async function deleteLead(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function convertLeadToStudent(leadId, studentId, tenantId) {
    return updateLead(leadId, tenantId, {
        converted_student_id: studentId,
        stage: "enrolled",
    });
}
