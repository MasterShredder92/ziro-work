import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_items";
const g = globalThis;
function store() {
    if (!g.__ziro_content_items_store)
        g.__ziro_content_items_store = new Map();
    return g.__ziro_content_items_store;
}
function newId() {
    return `ci_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        folder_id: (_c = input.folder_id) !== null && _c !== void 0 ? _c : null,
        title: String((_d = input.title) !== null && _d !== void 0 ? _d : "Untitled"),
        slug: (_e = input.slug) !== null && _e !== void 0 ? _e : null,
        description: (_f = input.description) !== null && _f !== void 0 ? _f : null,
        excerpt: (_g = input.excerpt) !== null && _g !== void 0 ? _g : null,
        body: typeof input.body === "string" ? input.body : "",
        kind: (_h = input.kind) !== null && _h !== void 0 ? _h : "note",
        content_type: typeof input.content_type === "string" && input.content_type.length > 0
            ? input.content_type
            : "markdown",
        visibility: (_j = input.visibility) !== null && _j !== void 0 ? _j : "tenant",
        tags: Array.isArray(input.tags) ? input.tags : [],
        collection_ids: Array.isArray(input.collection_ids)
            ? input.collection_ids
            : [],
        asset_ids: Array.isArray(input.asset_ids) ? input.asset_ids : [],
        current_version: typeof input.current_version === "number" && input.current_version > 0
            ? input.current_version
            : 1,
        is_published: input.is_published === true,
        is_archived: input.is_archived === true,
        pinned: input.pinned === true,
        file_url: (_k = input.file_url) !== null && _k !== void 0 ? _k : null,
        file_name: (_l = input.file_name) !== null && _l !== void 0 ? _l : null,
        mime_type: (_m = input.mime_type) !== null && _m !== void 0 ? _m : null,
        file_size_bytes: typeof input.file_size_bytes === "number" ? input.file_size_bytes : null,
        thumbnail_url: (_o = input.thumbnail_url) !== null && _o !== void 0 ? _o : null,
        source_url: (_p = input.source_url) !== null && _p !== void 0 ? _p : null,
        program_id: (_q = input.program_id) !== null && _q !== void 0 ? _q : null,
        level_id: (_r = input.level_id) !== null && _r !== void 0 ? _r : null,
        lesson_id: (_s = input.lesson_id) !== null && _s !== void 0 ? _s : null,
        author_id: (_t = input.author_id) !== null && _t !== void 0 ? _t : null,
        created_by: (_u = input.created_by) !== null && _u !== void 0 ? _u : null,
        updated_by: (_v = input.updated_by) !== null && _v !== void 0 ? _v : null,
        metadata: (_w = input.metadata) !== null && _w !== void 0 ? _w : {},
        access_count: typeof input.access_count === "number" ? input.access_count : 0,
        last_accessed_at: (_x = input.last_accessed_at) !== null && _x !== void 0 ? _x : null,
        created_at: (_y = input.created_at) !== null && _y !== void 0 ? _y : now,
        updated_at: (_z = input.updated_at) !== null && _z !== void 0 ? _z : now,
    };
}
export async function listContentItems(tenantId, filter) {
    var _a, _b;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if ((filter === null || filter === void 0 ? void 0 : filter.folderId) === null)
                query = query.is("folder_id", null);
            else if (filter === null || filter === void 0 ? void 0 : filter.folderId)
                query = query.eq("folder_id", filter.folderId);
            if (filter === null || filter === void 0 ? void 0 : filter.kind)
                query = query.eq("kind", filter.kind);
            if (filter === null || filter === void 0 ? void 0 : filter.contentType)
                query = query.eq("content_type", filter.contentType);
            if (filter === null || filter === void 0 ? void 0 : filter.visibility)
                query = query.eq("visibility", filter.visibility);
            if (filter === null || filter === void 0 ? void 0 : filter.tagId)
                query = query.contains("tags", [filter.tagId]);
            else if (filter === null || filter === void 0 ? void 0 : filter.tagSlug)
                query = query.contains("tags", [filter.tagSlug]);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived))
                query = query.eq("is_archived", false);
            if (filter === null || filter === void 0 ? void 0 : filter.publishedOnly)
                query = query.eq("is_published", true);
            const { data, error } = await query.order("updated_at", {
                ascending: false,
            });
            if (!error) {
                let rows = (data !== null && data !== void 0 ? data : []);
                const needle = (_a = filter === null || filter === void 0 ? void 0 : filter.search) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
                if (needle) {
                    rows = rows.filter((r) => {
                        var _a, _b, _c;
                        return r.title.toLowerCase().includes(needle) ||
                            ((_a = r.body) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(needle) ||
                            ((_b = r.excerpt) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(needle) ||
                            ((_c = r.description) !== null && _c !== void 0 ? _c : "").toLowerCase().includes(needle);
                    });
                }
                return rows;
            }
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    let rows = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    if ((filter === null || filter === void 0 ? void 0 : filter.folderId) === null)
        rows = rows.filter((r) => !r.folder_id);
    else if (filter === null || filter === void 0 ? void 0 : filter.folderId)
        rows = rows.filter((r) => r.folder_id === filter.folderId);
    if (filter === null || filter === void 0 ? void 0 : filter.kind)
        rows = rows.filter((r) => r.kind === filter.kind);
    if (filter === null || filter === void 0 ? void 0 : filter.contentType)
        rows = rows.filter((r) => r.content_type === filter.contentType);
    if (filter === null || filter === void 0 ? void 0 : filter.visibility)
        rows = rows.filter((r) => r.visibility === filter.visibility);
    if (filter === null || filter === void 0 ? void 0 : filter.tagId)
        rows = rows.filter((r) => r.tags.includes(filter.tagId));
    else if (filter === null || filter === void 0 ? void 0 : filter.tagSlug)
        rows = rows.filter((r) => r.tags.includes(filter.tagSlug));
    if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived))
        rows = rows.filter((r) => !r.is_archived);
    if (filter === null || filter === void 0 ? void 0 : filter.publishedOnly)
        rows = rows.filter((r) => r.is_published);
    const needle = (_b = filter === null || filter === void 0 ? void 0 : filter.search) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    if (needle) {
        rows = rows.filter((r) => {
            var _a, _b, _c;
            return r.title.toLowerCase().includes(needle) ||
                ((_a = r.body) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(needle) ||
                ((_b = r.excerpt) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(needle) ||
                ((_c = r.description) !== null && _c !== void 0 ? _c : "").toLowerCase().includes(needle);
        });
    }
    return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getContentItem(itemId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", itemId);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { data, error } = await query.maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const row = (_a = store().get(itemId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertContentItem(tenantId, input) {
    var _a;
    const existing = input.id ? (_a = store().get(input.id)) !== null && _a !== void 0 ? _a : null : null;
    const row = normalize(Object.assign(Object.assign(Object.assign({}, (existing !== null && existing !== void 0 ? existing : {})), input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else if (error)
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    store().set(row.id, row);
    return row;
}
export async function deleteContentItem(itemId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).delete().eq("id", itemId);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { error } = await query;
            if (!error)
                return;
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const row = store().get(itemId);
    if (row && (!tenantId || row.tenant_id === tenantId))
        store().delete(itemId);
}
