import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_versions";
const g = globalThis;
function store() {
    if (!g.__ziro_content_versions_store)
        g.__ziro_content_versions_store = new Map();
    return g.__ziro_content_versions_store;
}
function newId() {
    return `cv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: String((_c = input.item_id) !== null && _c !== void 0 ? _c : ""),
        version: typeof input.version === "number" ? input.version : 1,
        title: String((_d = input.title) !== null && _d !== void 0 ? _d : ""),
        body: String((_e = input.body) !== null && _e !== void 0 ? _e : ""),
        excerpt: (_f = input.excerpt) !== null && _f !== void 0 ? _f : null,
        content_type: (_g = input.content_type) !== null && _g !== void 0 ? _g : "markdown",
        change_summary: (_h = input.change_summary) !== null && _h !== void 0 ? _h : null,
        is_current: input.is_current === true,
        metadata: (_j = input.metadata) !== null && _j !== void 0 ? _j : {},
        created_at: (_k = input.created_at) !== null && _k !== void 0 ? _k : now,
        created_by: (_l = input.created_by) !== null && _l !== void 0 ? _l : null,
    };
}
export async function listContentVersions(itemId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("item_id", itemId)
                .order("version", { ascending: false });
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
    const rows = Array.from(store().values()).filter((r) => r.tenant_id === tenantId && r.item_id === itemId);
    return rows.sort((a, b) => b.version - a.version);
}
export async function getContentVersion(versionId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", versionId)
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
    const row = store().get(versionId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertContentVersion(tenantId, input) {
    const row = normalize(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
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
export async function markVersionCurrent(itemId, versionId, tenantId) {
    const versions = await listContentVersions(itemId, tenantId);
    for (const v of versions) {
        const shouldBeCurrent = v.id === versionId;
        if (v.is_current !== shouldBeCurrent) {
            await upsertContentVersion(tenantId, Object.assign(Object.assign({}, v), { is_current: shouldBeCurrent }));
        }
    }
}
export async function deleteContentVersionsForItem(itemId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("item_id", itemId);
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
    const toRemove = [];
    for (const [id, row] of store()) {
        if (row.tenant_id === tenantId && row.item_id === itemId)
            toRemove.push(id);
    }
    for (const id of toRemove)
        store().delete(id);
}
