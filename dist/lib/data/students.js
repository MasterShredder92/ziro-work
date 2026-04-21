import { clientFor, applyListOptions } from "./_client";
const TABLE = "students";
/**
 * Lessonpreneur stores `students.status` as free text (often Title Case).
 * The CRM filter sends lowercase buckets (`enrolled`, `active`, …) which
 * used to hit `.eq` and return zero rows. Map buckets to case-insensitive
 * OR groups; unknown values fall back to a single `ilike` (exact token, no wildcards).
 */
function applyLessonpreneurStatusFilter(query, status) {
    const raw = typeof status === "string" ? status.trim() : "";
    if (!raw)
        return query;
    const key = raw.toLowerCase();
    const escapeIlikeToken = (token) => token.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const orFromTokens = (tokens) => tokens.map((t) => `status.ilike.${escapeIlikeToken(t)}`).join(",");
    const bucket = {
        // "Enrolled" in the UI = on the roster, currently taking lessons
        enrolled: ["enrolled", "active", "current"],
        active: ["active", "current"],
        inactive: ["inactive", "former", "cancelled", "churned", "paused"],
        prospect: ["prospect", "lead", "trial", "inquiry"],
    };
    const tokens = bucket[key];
    if (tokens === null || tokens === void 0 ? void 0 : tokens.length)
        return query.or(orFromTokens(tokens));
    return query.ilike("status", escapeIlikeToken(raw));
}
export async function listStudents(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.family_id)
        query = query.eq("family_id", filter.family_id);
    if (filter === null || filter === void 0 ? void 0 : filter.teacher_id)
        query = query.eq("teacher_id", filter.teacher_id);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id)
        query = query.eq("location_id", filter.location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = applyLessonpreneurStatusFilter(query, filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.instrument)
        query = query.eq("instrument", filter.instrument);
    if (filter === null || filter === void 0 ? void 0 : filter.enrollment_type)
        query = query.eq("enrollment_type", filter.enrollment_type);
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
export async function getStudentsByIds(tenantId, ids) {
    if (ids.length === 0)
        return [];
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .in("id", ids);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getStudentById(id, tenantId) {
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
export async function createStudent(tenantId, input) {
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
export async function updateStudent(id, tenantId, input) {
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
export async function deleteStudent(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function deactivateStudent(id, tenantId, deactivatedBy, reason, category) {
    return updateStudent(id, tenantId, {
        status: "inactive",
        deactivated_at: new Date().toISOString(),
        deactivated_by: deactivatedBy,
        exit_reason: reason !== null && reason !== void 0 ? reason : null,
        exit_category: category !== null && category !== void 0 ? category : null,
    });
}
