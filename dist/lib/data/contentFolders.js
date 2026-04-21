import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_folders";
const g = globalThis;
function store() {
    if (!g.__ziro_content_folders_store)
        g.__ziro_content_folders_store = new Map();
    return g.__ziro_content_folders_store;
}
function newId() {
    return `cf_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        parent_id: (_c = input.parent_id) !== null && _c !== void 0 ? _c : null,
        name: String((_d = input.name) !== null && _d !== void 0 ? _d : "Untitled folder"),
        slug: (_e = input.slug) !== null && _e !== void 0 ? _e : null,
        description: (_f = input.description) !== null && _f !== void 0 ? _f : null,
        sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
        pinned: input.pinned === true,
        color: (_g = input.color) !== null && _g !== void 0 ? _g : null,
        created_at: (_h = input.created_at) !== null && _h !== void 0 ? _h : now,
        updated_at: (_j = input.updated_at) !== null && _j !== void 0 ? _j : now,
        created_by: (_k = input.created_by) !== null && _k !== void 0 ? _k : null,
    };
}
export async function listContentFolders(tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .order("sort_order", { ascending: true })
                .order("name", { ascending: true });
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
        .sort((a, b) => {
        const so = a.sort_order - b.sort_order;
        if (so !== 0)
            return so;
        return a.name.localeCompare(b.name);
    });
}
export async function getContentFolder(folderId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", folderId)
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
    const row = store().get(folderId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertContentFolder(tenantId, input) {
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
export async function deleteContentFolder(folderId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", folderId);
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
    const row = store().get(folderId);
    if (row && row.tenant_id === tenantId)
        store().delete(folderId);
}
