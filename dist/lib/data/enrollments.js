import { clientFor, applyListOptions } from "./_client";
const TABLE = "enrollments";
/** Active enrollment counts per teacher (CRM teacher load column). */
export async function countActiveEnrollmentsByTeacherIds(tenantId, teacherIds) {
    if (teacherIds.length === 0)
        return {};
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("teacher_id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .in("teacher_id", teacherIds);
    if (error)
        throw error;
    const counts = {};
    for (const id of teacherIds)
        counts[id] = 0;
    for (const row of data !== null && data !== void 0 ? data : []) {
        const tid = row.teacher_id;
        if (tid && counts[tid] !== undefined)
            counts[tid] += 1;
    }
    return counts;
}
/** All enrollment rows per teacher (any status). */
export async function countEnrollmentsByTeacherIds(tenantId, teacherIds) {
    if (teacherIds.length === 0)
        return {};
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("teacher_id")
        .eq("tenant_id", tenantId)
        .in("teacher_id", teacherIds);
    if (error)
        throw error;
    const counts = {};
    for (const id of teacherIds)
        counts[id] = 0;
    for (const row of data !== null && data !== void 0 ? data : []) {
        const tid = row.teacher_id;
        if (tid && counts[tid] !== undefined)
            counts[tid] += 1;
    }
    return counts;
}
export async function listEnrollments(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.student_id)
        query = query.eq("student_id", filter.student_id);
    if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
        query = query.eq("teacher_id", filter.teacher_id);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
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
export async function getEnrollmentById(id, tenantId) {
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
export async function createEnrollment(tenantId, input) {
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
export async function updateEnrollment(id, tenantId, input) {
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
export async function deleteEnrollment(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function endEnrollment(id, tenantId, endDate) {
    return updateEnrollment(id, tenantId, {
        status: "ended",
        end_date: endDate,
    });
}
