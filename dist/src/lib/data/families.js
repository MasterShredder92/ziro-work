import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
function escapeLikeTerm(term) {
    return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
function applyFamilySearch(q, term) {
    const t = `%${escapeLikeTerm(term)}%`;
    // PostgREST OR filter
    return q.or([
        `name.ilike.${t}`,
        `primary_email.ilike.${t}`,
        `primary_phone.ilike.${t}`,
    ].join(","));
}
export async function listFamilies(client, params) {
    var _a;
    try {
        const base = client
            .from("families")
            .select("*")
            .eq("tenant_id", params.tenantId);
        const withArchived = params.includeArchived === true
            ? base
            : base.is("archived_at", null);
        const withSearch = params.search && params.search.trim().length > 0
            ? applyFamilySearch(withArchived, params.search.trim())
            : withArchived;
        const withLocation = params.locationId
            ? withSearch.or([
                `primary_location_id.eq.${params.locationId}`,
                "primary_location_id.is.null",
            ].join(","))
            : withSearch;
        if (params.page.mode === "offset") {
            const { page, pageSize, from, to } = offsetRange(params.page.page, params.page.pageSize);
            const { data, error } = await withLocation
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .range(from, to);
            if (error)
                return { data: null, error: toErrorInfo(error) };
            return {
                data: {
                    items: (data !== null && data !== void 0 ? data : []).map((r) => r),
                    pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
                },
                error: null,
            };
        }
        const limit = Number.isFinite(params.page.limit) && params.page.limit > 0
            ? Math.floor(params.page.limit)
            : 50;
        const cursor = (_a = params.page.cursor) === null || _a === void 0 ? void 0 : _a.trim();
        const decoded = cursor ? decodeCursor(cursor) : null;
        let q = withLocation
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit);
        if ((decoded === null || decoded === void 0 ? void 0 : decoded.created_at) && (decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
            // Descending pagination: fetch rows "after" the cursor.
            q = q.or([
                `created_at.lt.${decoded.created_at}`,
                `and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`,
            ].join(","));
        }
        const { data, error } = await q;
        if (error)
            return { data: null, error: toErrorInfo(error) };
        const items = (data !== null && data !== void 0 ? data : []).map((r) => r);
        const last = items.at(-1);
        const nextCursor = (last === null || last === void 0 ? void 0 : last.created_at) && (last === null || last === void 0 ? void 0 : last.id)
            ? encodeCursor({ created_at: last.created_at, id: last.id })
            : undefined;
        return {
            data: {
                items,
                pageInfo: {
                    mode: "cursor",
                    cursor: cursor || undefined,
                    limit,
                    nextCursor,
                },
            },
            error: null,
        };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function getFamilyById(client, tenantId, id) {
    try {
        const { data, error } = await client
            .from("families")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .maybeSingle();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: (data !== null && data !== void 0 ? data : null), error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function createFamily(client, input) {
    try {
        const { data, error } = await client
            .from("families")
            .insert(input)
            .select("*")
            .single();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: data, error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function updateFamily(client, tenantId, id, patch) {
    try {
        const { data, error } = await client
            .from("families")
            .update(patch)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: data, error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function archiveFamily(client, tenantId, id, archivedAt = new Date().toISOString()) {
    return updateFamily(client, tenantId, id, { archived_at: archivedAt });
}
