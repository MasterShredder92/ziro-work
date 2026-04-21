import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_collections";
const g = globalThis;
function store() {
    if (!g.__ziro_content_collections_store) {
        g.__ziro_content_collections_store = new Map();
    }
    return g.__ziro_content_collections_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `ccol_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        title: String((_c = input.title) !== null && _c !== void 0 ? _c : "Untitled collection"),
        description: (_d = input.description) !== null && _d !== void 0 ? _d : null,
        visibility: ((_e = input.visibility) !== null && _e !== void 0 ? _e : "tenant"),
        cover_url: (_f = input.cover_url) !== null && _f !== void 0 ? _f : null,
        tags: Array.isArray(input.tags) ? input.tags : [],
        item_ids: Array.isArray(input.item_ids) ? input.item_ids : [],
        author_id: (_g = input.author_id) !== null && _g !== void 0 ? _g : null,
        created_at: (_h = input.created_at) !== null && _h !== void 0 ? _h : now,
        updated_at: (_j = input.updated_at) !== null && _j !== void 0 ? _j : now,
    };
}
export async function listContentCollections(tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
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
    return Array.from(store().values())
        .filter((r) => r.tenant_id === tenantId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getContentCollection(collectionId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", collectionId);
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
    const row = (_a = store().get(collectionId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertContentCollection(tenantId, input) {
    var _a;
    const existing = input.id ? (_a = store().get(input.id)) !== null && _a !== void 0 ? _a : null : null;
    const row = normalizeRow(Object.assign(Object.assign(Object.assign({}, (existing !== null && existing !== void 0 ? existing : {})), input), { tenant_id: tenantId, updated_at: nowIso() }));
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
