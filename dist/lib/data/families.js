import { clientFor, applyListOptions } from "./_client";
const TABLE = "families";
function escapeIlikeTerm(term) {
    return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
export async function getFamiliesForTenant(tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getFamilyById(id, tenantId) {
    const supabase = clientFor(tenantId !== null && tenantId !== void 0 ? tenantId : "");
    let q = supabase.from(TABLE).select("*").eq("id", id);
    if (tenantId)
        q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
/** Count active student rows per family (for CRM list columns). */
export async function countStudentsByFamilyIds(tenantId, familyIds) {
    if (familyIds.length === 0)
        return {};
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("students")
        .select("family_id")
        .eq("tenant_id", tenantId)
        .in("family_id", familyIds);
    if (error)
        throw error;
    const counts = {};
    for (const id of familyIds)
        counts[id] = 0;
    for (const row of data !== null && data !== void 0 ? data : []) {
        const fid = row.family_id;
        if (fid && counts[fid] !== undefined)
            counts[fid] += 1;
    }
    return counts;
}
export async function listFamilies(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if ((filter === null || filter === void 0 ? void 0 : filter.family_ids) && filter.family_ids.length > 0) {
        query = query.in("id", filter.family_ids);
    }
    if (filter === null || filter === void 0 ? void 0 : filter.primary_location_id)
        query = query.eq("primary_location_id", filter.primary_location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.billing_status)
        query = query.eq("billing_status", filter.billing_status);
    if (typeof (filter === null || filter === void 0 ? void 0 : filter.autopay_enabled) === "boolean")
        query = query.eq("autopay_enabled", filter.autopay_enabled);
    if (filter === null || filter === void 0 ? void 0 : filter.profile_id)
        query = query.eq("profile_id", filter.profile_id);
    if (filter === null || filter === void 0 ? void 0 : filter.referred_by_family_id)
        query = query.eq("referred_by_family_id", filter.referred_by_family_id);
    if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim().length > 0) {
        const t = escapeIlikeTerm(filter.search.trim());
        query = query.or([
            `name.ilike.%${t}%`,
            `primary_email.ilike.%${t}%`,
            `primary_phone.ilike.%${t}%`,
            `primary_contact_name.ilike.%${t}%`,
            `parent_name.ilike.%${t}%`,
        ].join(","));
    }
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
export async function createFamily(tenantId, input) {
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
export async function deleteFamily(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function updateFamily(id, tenantId, input) {
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
