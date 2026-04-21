import { clientFor, serviceClient } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const TABLE = "file_share_links";
function store() {
    const g = globalThis;
    if (!g.__ziro_file_share_links)
        g.__ziro_file_share_links = new Map();
    return g.__ziro_file_share_links;
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `share_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function nowIso() {
    return new Date().toISOString();
}
export async function listShareLinks(tenantId, filter) {
    if (tableMissing(TABLE)) {
        const out = [];
        for (const row of store().values()) {
            if (row.tenant_id !== tenantId)
                continue;
            if ((filter === null || filter === void 0 ? void 0 : filter.fileId) && row.file_id !== filter.fileId)
                continue;
            if ((filter === null || filter === void 0 ? void 0 : filter.folderId) && row.folder_id !== filter.folderId)
                continue;
            if ((filter === null || filter === void 0 ? void 0 : filter.status) && row.status !== filter.status)
                continue;
            out.push(row);
        }
        return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    try {
        const supabase = clientFor(tenantId);
        let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.fileId)
            query = query.eq("file_id", filter.fileId);
        if (filter === null || filter === void 0 ? void 0 : filter.folderId)
            query = query.eq("folder_id", filter.folderId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            query = query.eq("status", filter.status);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listShareLinks(tenantId, filter);
        }
        throw err;
    }
}
export async function getShareLink(id, tenantId) {
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
            return getShareLink(id, tenantId);
        }
        throw err;
    }
}
export async function getShareLinkByToken(token) {
    if (tableMissing(TABLE)) {
        for (const row of store().values()) {
            if (row.token === token)
                return row;
        }
        return null;
    }
    try {
        const supabase = serviceClient();
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("token", token)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return getShareLinkByToken(token);
        }
        throw err;
    }
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const now = nowIso();
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const token = (_d = (_c = input.token) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.token) !== null && _d !== void 0 ? _d : uuid().replace(/[^a-z0-9]/gi, "").slice(0, 32);
    return {
        id,
        tenant_id: tenantId,
        file_id: (_f = (_e = input.file_id) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.file_id) !== null && _f !== void 0 ? _f : null,
        folder_id: (_h = (_g = input.folder_id) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.folder_id) !== null && _h !== void 0 ? _h : null,
        token,
        status: (_k = (_j = input.status) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _k !== void 0 ? _k : "active",
        password_hash: (_m = (_l = input.password_hash) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.password_hash) !== null && _m !== void 0 ? _m : null,
        expires_at: (_p = (_o = input.expires_at) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.expires_at) !== null && _p !== void 0 ? _p : null,
        max_views: (_r = (_q = input.max_views) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.max_views) !== null && _r !== void 0 ? _r : null,
        view_count: (_t = (_s = input.view_count) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.view_count) !== null && _t !== void 0 ? _t : 0,
        allow_download: (_v = (_u = input.allow_download) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.allow_download) !== null && _v !== void 0 ? _v : true,
        metadata: input.metadata !== undefined
            ? ((_w = input.metadata) !== null && _w !== void 0 ? _w : {})
            : ((_x = existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _x !== void 0 ? _x : {}),
        created_by: (_z = (_y = input.created_by) !== null && _y !== void 0 ? _y : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _z !== void 0 ? _z : null,
        created_at: (_0 = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _0 !== void 0 ? _0 : now,
        updated_at: now,
    };
}
export async function upsertShareLink(tenantId, input) {
    const existing = input.id ? await getShareLink(input.id, tenantId) : null;
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
export async function incrementShareLinkViewCount(id, tenantId) {
    const existing = await getShareLink(id, tenantId);
    if (!existing)
        return null;
    return upsertShareLink(tenantId, {
        id,
        view_count: existing.view_count + 1,
    });
}
export async function revokeShareLink(id, tenantId) {
    await upsertShareLink(tenantId, { id, status: "revoked" });
}
export async function deleteShareLink(id, tenantId) {
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
            return deleteShareLink(id, tenantId);
        }
        throw err;
    }
}
