import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const FILES_TABLE = "files";
function store() {
    const g = globalThis;
    if (!g.__ziro_files_store)
        g.__ziro_files_store = new Map();
    return g.__ziro_files_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `file_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function matchFilter(row, f) {
    var _a, _b, _c, _d;
    if (!f)
        return true;
    if (f.folderId !== undefined) {
        if (((_a = row.folder_id) !== null && _a !== void 0 ? _a : null) !== ((_b = f.folderId) !== null && _b !== void 0 ? _b : null))
            return false;
    }
    if (f.ownerId && row.owner_id !== f.ownerId)
        return false;
    if (f.mimeType && !row.mime_type.startsWith(f.mimeType))
        return false;
    if (f.status && row.status !== f.status)
        return false;
    if (f.signatureStatus && row.signature_status !== f.signatureStatus)
        return false;
    if (f.search && f.search.trim().length > 0) {
        const s = f.search.trim().toLowerCase();
        const hit = row.name.toLowerCase().includes(s) ||
            ((_d = (_c = row.description) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(s)) !== null && _d !== void 0 ? _d : false);
        if (!hit)
            return false;
    }
    return true;
}
function listFromStore(tenantId, f) {
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if (row.status === "deleted")
            continue;
        if (!matchFilter(row, f))
            continue;
        out.push(row);
    }
    out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return (f === null || f === void 0 ? void 0 : f.limit) ? out.slice(0, f.limit) : out;
}
export async function listFiles(tenantId, filter) {
    if (tableMissing(FILES_TABLE))
        return listFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase.from(FILES_TABLE).select("*").eq("tenant_id", tenantId);
        if ((filter === null || filter === void 0 ? void 0 : filter.folderId) !== undefined) {
            if (filter.folderId === null)
                query = query.is("folder_id", null);
            else
                query = query.eq("folder_id", filter.folderId);
        }
        if (filter === null || filter === void 0 ? void 0 : filter.ownerId)
            query = query.eq("owner_id", filter.ownerId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            query = query.eq("status", filter.status);
        else
            query = query.neq("status", "deleted");
        if (filter === null || filter === void 0 ? void 0 : filter.signatureStatus)
            query = query.eq("signature_status", filter.signatureStatus);
        const { data, error } = await query.order("updated_at", { ascending: false });
        if (error)
            throw error;
        const rows = (data !== null && data !== void 0 ? data : []);
        return (filter === null || filter === void 0 ? void 0 : filter.limit) ? rows.slice(0, filter.limit) : rows;
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            return listFromStore(tenantId, filter);
        }
        throw err;
    }
}
/**
 * Find an active file in a folder (or root when folderId is null) by exact name.
 */
export async function findFileByFolderAndName(tenantId, folderId, name) {
    var _a;
    const trimmed = name.trim();
    if (!trimmed)
        return null;
    if (tableMissing(FILES_TABLE)) {
        for (const row of store().values()) {
            if (row.tenant_id !== tenantId)
                continue;
            if (row.status === "deleted")
                continue;
            if (((_a = row.folder_id) !== null && _a !== void 0 ? _a : null) !== (folderId !== null && folderId !== void 0 ? folderId : null))
                continue;
            if (row.name === trimmed)
                return row;
        }
        return null;
    }
    try {
        const supabase = clientFor(tenantId);
        let query = supabase
            .from(FILES_TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("name", trimmed)
            .neq("status", "deleted");
        if (folderId === null)
            query = query.is("folder_id", null);
        else
            query = query.eq("folder_id", folderId);
        const { data, error } = await query.maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            return findFileByFolderAndName(tenantId, folderId, name);
        }
        throw err;
    }
}
export async function getFile(id, tenantId) {
    if (tableMissing(FILES_TABLE)) {
        const row = store().get(id);
        if (!row || row.tenant_id !== tenantId)
            return null;
        return row;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(FILES_TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            return getFile(id, tenantId);
        }
        throw err;
    }
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22;
    const now = nowIso();
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    return {
        id,
        tenant_id: tenantId,
        folder_id: (_d = (_c = input.folder_id) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.folder_id) !== null && _d !== void 0 ? _d : null,
        owner_id: (_f = (_e = input.owner_id) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.owner_id) !== null && _f !== void 0 ? _f : null,
        name: (_h = (_g = input.name) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _h !== void 0 ? _h : "Untitled file",
        description: (_k = (_j = input.description) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.description) !== null && _k !== void 0 ? _k : null,
        mime_type: (_m = (_l = input.mime_type) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.mime_type) !== null && _m !== void 0 ? _m : "application/octet-stream",
        size: (_p = (_o = input.size) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.size) !== null && _p !== void 0 ? _p : 0,
        extension: (_r = (_q = input.extension) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.extension) !== null && _r !== void 0 ? _r : null,
        storage_key: (_t = (_s = input.storage_key) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.storage_key) !== null && _t !== void 0 ? _t : null,
        storage_bucket: (_v = (_u = input.storage_bucket) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.storage_bucket) !== null && _v !== void 0 ? _v : null,
        checksum: (_x = (_w = input.checksum) !== null && _w !== void 0 ? _w : existing === null || existing === void 0 ? void 0 : existing.checksum) !== null && _x !== void 0 ? _x : null,
        visibility: (_z = (_y = input.visibility) !== null && _y !== void 0 ? _y : existing === null || existing === void 0 ? void 0 : existing.visibility) !== null && _z !== void 0 ? _z : "tenant",
        status: (_1 = (_0 = input.status) !== null && _0 !== void 0 ? _0 : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _1 !== void 0 ? _1 : "active",
        current_version_id: (_3 = (_2 = input.current_version_id) !== null && _2 !== void 0 ? _2 : existing === null || existing === void 0 ? void 0 : existing.current_version_id) !== null && _3 !== void 0 ? _3 : null,
        thumbnail_key: (_5 = (_4 = input.thumbnail_key) !== null && _4 !== void 0 ? _4 : existing === null || existing === void 0 ? void 0 : existing.thumbnail_key) !== null && _5 !== void 0 ? _5 : null,
        virus_scan_status: (_7 = (_6 = input.virus_scan_status) !== null && _6 !== void 0 ? _6 : existing === null || existing === void 0 ? void 0 : existing.virus_scan_status) !== null && _7 !== void 0 ? _7 : "skipped",
        signature_status: (_9 = (_8 = input.signature_status) !== null && _8 !== void 0 ? _8 : existing === null || existing === void 0 ? void 0 : existing.signature_status) !== null && _9 !== void 0 ? _9 : null,
        tags: (_11 = (_10 = input.tags) !== null && _10 !== void 0 ? _10 : existing === null || existing === void 0 ? void 0 : existing.tags) !== null && _11 !== void 0 ? _11 : [],
        acl: (_13 = (_12 = input.acl) !== null && _12 !== void 0 ? _12 : existing === null || existing === void 0 ? void 0 : existing.acl) !== null && _13 !== void 0 ? _13 : [],
        metadata: (_15 = (_14 = input.metadata) !== null && _14 !== void 0 ? _14 : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _15 !== void 0 ? _15 : {},
        created_at: (_16 = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _16 !== void 0 ? _16 : now,
        updated_at: now,
        created_by: (_18 = (_17 = input.created_by) !== null && _17 !== void 0 ? _17 : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _18 !== void 0 ? _18 : null,
        updated_by: (_22 = (_21 = (_20 = (_19 = input.updated_by) !== null && _19 !== void 0 ? _19 : input.created_by) !== null && _20 !== void 0 ? _20 : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _21 !== void 0 ? _21 : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _22 !== void 0 ? _22 : null,
    };
}
export async function upsertFile(tenantId, input) {
    const existing = input.id ? await getFile(input.id, tenantId) : null;
    const next = merge(existing !== null && existing !== void 0 ? existing : undefined, tenantId, input);
    if (tableMissing(FILES_TABLE)) {
        store().set(next.id, next);
        return next;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(FILES_TABLE)
            .upsert(next, { onConflict: "id" })
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            store().set(next.id, next);
            return next;
        }
        throw err;
    }
}
export async function deleteFile(id, tenantId) {
    if (tableMissing(FILES_TABLE)) {
        const row = store().get(id);
        if (row && row.tenant_id === tenantId) {
            store().set(id, Object.assign(Object.assign({}, row), { status: "deleted", updated_at: nowIso() }));
        }
        return;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error } = await supabase
            .from(FILES_TABLE)
            .update({ status: "deleted", updated_at: nowIso() })
            .eq("tenant_id", tenantId)
            .eq("id", id);
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            return deleteFile(id, tenantId);
        }
        throw err;
    }
}
export async function hardDeleteFile(id, tenantId) {
    if (tableMissing(FILES_TABLE)) {
        const row = store().get(id);
        if (row && row.tenant_id === tenantId)
            store().delete(id);
        return;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error } = await supabase
            .from(FILES_TABLE)
            .delete()
            .eq("tenant_id", tenantId)
            .eq("id", id);
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, FILES_TABLE)) {
            markTableMissing(FILES_TABLE);
            return hardDeleteFile(id, tenantId);
        }
        throw err;
    }
}
