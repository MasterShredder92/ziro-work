import { clientFor, serviceClient } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const TABLE = "file_signature_requests";
function store() {
    const g = globalThis;
    if (!g.__ziro_file_signature_requests)
        g.__ziro_file_signature_requests = new Map();
    return g.__ziro_file_signature_requests;
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `sig_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function nowIso() {
    return new Date().toISOString();
}
export async function listSignatureRequests(tenantId, filter) {
    if (tableMissing(TABLE)) {
        const out = [];
        for (const row of store().values()) {
            if (row.tenant_id !== tenantId)
                continue;
            if ((filter === null || filter === void 0 ? void 0 : filter.fileId) && row.file_id !== filter.fileId)
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
            return listSignatureRequests(tenantId, filter);
        }
        throw err;
    }
}
export async function getSignatureRequest(id, tenantId) {
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
            return getSignatureRequest(id, tenantId);
        }
        throw err;
    }
}
export async function getSignatureRequestBySignerToken(token) {
    var _a;
    if (tableMissing(TABLE)) {
        for (const row of store().values()) {
            const signers = row.signers;
            if (signers.some((s) => (s === null || s === void 0 ? void 0 : s.token) === token))
                return row;
        }
        return null;
    }
    try {
        const supabase = serviceClient();
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .contains("signers", JSON.stringify([{ token }]));
        if (error)
            throw error;
        const rows = (data !== null && data !== void 0 ? data : []);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return getSignatureRequestBySignerToken(token);
        }
        throw err;
    }
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const now = nowIso();
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    return {
        id,
        tenant_id: tenantId,
        file_id: (_d = (_c = input.file_id) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.file_id) !== null && _d !== void 0 ? _d : "",
        title: (_f = (_e = input.title) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.title) !== null && _f !== void 0 ? _f : "Signature request",
        message: (_h = (_g = input.message) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.message) !== null && _h !== void 0 ? _h : null,
        status: (_k = (_j = input.status) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _k !== void 0 ? _k : "pending",
        signers: (_m = (_l = input.signers) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.signers) !== null && _m !== void 0 ? _m : [],
        fields: (_p = (_o = input.fields) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.fields) !== null && _p !== void 0 ? _p : [],
        audit: (_r = (_q = input.audit) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.audit) !== null && _r !== void 0 ? _r : [],
        certificate_key: (_t = (_s = input.certificate_key) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.certificate_key) !== null && _t !== void 0 ? _t : null,
        completed_at: (_v = (_u = input.completed_at) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.completed_at) !== null && _v !== void 0 ? _v : null,
        expires_at: (_x = (_w = input.expires_at) !== null && _w !== void 0 ? _w : existing === null || existing === void 0 ? void 0 : existing.expires_at) !== null && _x !== void 0 ? _x : null,
        created_by: (_z = (_y = input.created_by) !== null && _y !== void 0 ? _y : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _z !== void 0 ? _z : null,
        created_at: (_0 = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _0 !== void 0 ? _0 : now,
        updated_at: now,
    };
}
export async function upsertSignatureRequest(tenantId, input) {
    const existing = input.id ? await getSignatureRequest(input.id, tenantId) : null;
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
export async function deleteSignatureRequest(id, tenantId) {
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
            return deleteSignatureRequest(id, tenantId);
        }
        throw err;
    }
}
