import { clientFor, applyListOptions } from "./_client";
const TABLE = "locations";
export async function listLocations(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean")
        query = query.eq("is_active", filter.is_active);
    if (filter === null || filter === void 0 ? void 0 : filter.state)
        query = query.eq("state", filter.state);
    if (filter === null || filter === void 0 ? void 0 : filter.city)
        query = query.eq("city", filter.city);
    if ((filter === null || filter === void 0 ? void 0 : filter.ids) && filter.ids.length > 0)
        query = query.in("id", filter.ids);
    if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim().length > 0) {
        const s = filter.search.trim();
        query = query.or([
            `name.ilike.%${s}%`,
            `city.ilike.%${s}%`,
            `address.ilike.%${s}%`,
        ].join(","));
    }
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "name",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getLocationById(id, tenantId) {
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
export async function createLocation(tenantId, input) {
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
export async function updateLocation(id, tenantId, input) {
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
