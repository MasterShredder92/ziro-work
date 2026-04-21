import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_embeddings";
const g = globalThis;
function store() {
    if (!g.__ziro_content_embeddings_store) {
        g.__ziro_content_embeddings_store = new Map();
    }
    return g.__ziro_content_embeddings_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `cembed_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const vector = Array.isArray(input.vector) ? input.vector : [];
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: String((_c = input.item_id) !== null && _c !== void 0 ? _c : ""),
        model: String((_d = input.model) !== null && _d !== void 0 ? _d : "text-embedding-3-small"),
        dimensions: typeof input.dimensions === "number" ? input.dimensions : vector.length,
        vector,
        content_hash: (_e = input.content_hash) !== null && _e !== void 0 ? _e : null,
        created_at: (_f = input.created_at) !== null && _f !== void 0 ? _f : now,
        updated_at: (_g = input.updated_at) !== null && _g !== void 0 ? _g : now,
    };
}
export async function listContentEmbeddings(tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId);
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
    return Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
}
export async function getContentEmbedding(itemId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("item_id", itemId);
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
    for (const row of store().values()) {
        if (row.item_id === itemId) {
            if (tenantId && row.tenant_id !== tenantId)
                continue;
            return row;
        }
    }
    return null;
}
export async function upsertContentEmbedding(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "item_id" })
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
    for (const existing of store().values()) {
        if (existing.item_id === row.item_id && existing.tenant_id === tenantId) {
            store().delete(existing.id);
        }
    }
    store().set(row.id, row);
    return row;
}
