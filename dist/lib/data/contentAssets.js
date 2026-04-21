import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_assets";
const g = globalThis;
function store() {
    if (!g.__ziro_content_assets_store)
        g.__ziro_content_assets_store = new Map();
    return g.__ziro_content_assets_store;
}
function newId() {
    return `ca_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: (_c = input.item_id) !== null && _c !== void 0 ? _c : null,
        folder_id: (_d = input.folder_id) !== null && _d !== void 0 ? _d : null,
        kind: (_e = input.kind) !== null && _e !== void 0 ? _e : "file",
        name: String((_f = input.name) !== null && _f !== void 0 ? _f : "untitled"),
        url: String((_g = input.url) !== null && _g !== void 0 ? _g : ""),
        mime_type: (_h = input.mime_type) !== null && _h !== void 0 ? _h : null,
        size_bytes: typeof input.size_bytes === "number" ? input.size_bytes : null,
        storage_path: (_j = input.storage_path) !== null && _j !== void 0 ? _j : null,
        thumbnail_url: (_k = input.thumbnail_url) !== null && _k !== void 0 ? _k : null,
        alt_text: (_l = input.alt_text) !== null && _l !== void 0 ? _l : null,
        metadata: (_m = input.metadata) !== null && _m !== void 0 ? _m : {},
        created_at: (_o = input.created_at) !== null && _o !== void 0 ? _o : now,
        updated_at: (_p = input.updated_at) !== null && _p !== void 0 ? _p : now,
        created_by: (_q = input.created_by) !== null && _q !== void 0 ? _q : null,
    };
}
export async function listContentAssets(tenantId, filter) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if ((filter === null || filter === void 0 ? void 0 : filter.itemId) === null)
                query = query.is("item_id", null);
            else if (filter === null || filter === void 0 ? void 0 : filter.itemId)
                query = query.eq("item_id", filter.itemId);
            if ((filter === null || filter === void 0 ? void 0 : filter.folderId) === null)
                query = query.is("folder_id", null);
            else if (filter === null || filter === void 0 ? void 0 : filter.folderId)
                query = query.eq("folder_id", filter.folderId);
            if (filter === null || filter === void 0 ? void 0 : filter.kind)
                query = query.eq("kind", filter.kind);
            const { data, error } = await query.order("updated_at", {
                ascending: false,
            });
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
    let rows = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    if ((filter === null || filter === void 0 ? void 0 : filter.itemId) === null)
        rows = rows.filter((r) => !r.item_id);
    else if (filter === null || filter === void 0 ? void 0 : filter.itemId)
        rows = rows.filter((r) => r.item_id === filter.itemId);
    if ((filter === null || filter === void 0 ? void 0 : filter.folderId) === null)
        rows = rows.filter((r) => !r.folder_id);
    else if (filter === null || filter === void 0 ? void 0 : filter.folderId)
        rows = rows.filter((r) => r.folder_id === filter.folderId);
    if (filter === null || filter === void 0 ? void 0 : filter.kind)
        rows = rows.filter((r) => r.kind === filter.kind);
    return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getContentAsset(assetId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", assetId)
                .maybeSingle();
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
    const row = store().get(assetId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertContentAsset(tenantId, input) {
    const row = normalize(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
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
export async function deleteContentAsset(assetId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", assetId);
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
    const row = store().get(assetId);
    if (row && row.tenant_id === tenantId)
        store().delete(assetId);
}
