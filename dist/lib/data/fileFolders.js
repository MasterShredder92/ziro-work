import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const TABLE = "file_folders";
function store() {
    const g = globalThis;
    if (!g.__ziro_file_folders)
        g.__ziro_file_folders = new Map();
    return g.__ziro_file_folders;
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `folder_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function nowIso() {
    return new Date().toISOString();
}
function listFromStore(tenantId, parentId) {
    var _a;
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if (parentId !== undefined && ((_a = row.parent_id) !== null && _a !== void 0 ? _a : null) !== (parentId !== null && parentId !== void 0 ? parentId : null))
            continue;
        out.push(row);
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}
export async function listFolders(tenantId, parentId) {
    if (tableMissing(TABLE))
        return listFromStore(tenantId, parentId);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
        if (parentId !== undefined) {
            if (parentId === null)
                query = query.is("parent_id", null);
            else
                query = query.eq("parent_id", parentId);
        }
        const { data, error } = await query.order("name", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listFromStore(tenantId, parentId);
        }
        throw err;
    }
}
export async function getFolder(id, tenantId) {
    if (tableMissing(TABLE)) {
        const row = store().get(id);
        if (!row || row.tenant_id !== tenantId)
            return null;
        return row;
    }
    try {
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
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return getFolder(id, tenantId);
        }
        throw err;
    }
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const now = nowIso();
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const name = (_d = (_c = input.name) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _d !== void 0 ? _d : "Untitled folder";
    const parentId = (_f = (_e = input.parent_id) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.parent_id) !== null && _f !== void 0 ? _f : null;
    const path = (_h = (_g = input.path) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.path) !== null && _h !== void 0 ? _h : name;
    return {
        id,
        tenant_id: tenantId,
        parent_id: parentId,
        name,
        description: (_k = (_j = input.description) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.description) !== null && _k !== void 0 ? _k : null,
        path,
        owner_id: (_m = (_l = input.owner_id) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.owner_id) !== null && _m !== void 0 ? _m : null,
        visibility: (_p = (_o = input.visibility) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.visibility) !== null && _p !== void 0 ? _p : "tenant",
        acl: (_r = (_q = input.acl) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.acl) !== null && _r !== void 0 ? _r : [],
        metadata: (_t = (_s = input.metadata) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _t !== void 0 ? _t : {},
        created_at: (_u = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _u !== void 0 ? _u : now,
        updated_at: now,
        created_by: (_w = (_v = input.created_by) !== null && _v !== void 0 ? _v : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _w !== void 0 ? _w : null,
        updated_by: (_0 = (_z = (_y = (_x = input.updated_by) !== null && _x !== void 0 ? _x : input.created_by) !== null && _y !== void 0 ? _y : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _z !== void 0 ? _z : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _0 !== void 0 ? _0 : null,
    };
}
export async function upsertFolder(tenantId, input) {
    const existing = input.id ? await getFolder(input.id, tenantId) : null;
    const next = merge(existing !== null && existing !== void 0 ? existing : undefined, tenantId, input);
    if (tableMissing(TABLE)) {
        store().set(next.id, next);
        return next;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .upsert(next, { onConflict: "id" })
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            store().set(next.id, next);
            return next;
        }
        throw err;
    }
}
export async function deleteFolder(id, tenantId) {
    if (tableMissing(TABLE)) {
        const row = store().get(id);
        if (row && row.tenant_id === tenantId)
            store().delete(id);
        return;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq("tenant_id", tenantId)
            .eq("id", id);
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return deleteFolder(id, tenantId);
        }
        throw err;
    }
}
