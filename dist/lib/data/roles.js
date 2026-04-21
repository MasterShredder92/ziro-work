import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "roles";
function store() {
    const g = globalThis;
    if (!g.__ziro_roles_store)
        g.__ziro_roles_store = new Map();
    return g.__ziro_roles_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `role_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function mergeRole(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const now = nowIso();
    const key = ((_d = (_c = input.key) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.key) !== null && _d !== void 0 ? _d : id).trim();
    return {
        id,
        tenant_id: tenantId,
        key,
        name: (_f = (_e = input.name) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _f !== void 0 ? _f : key,
        description: (_h = (_g = input.description) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.description) !== null && _h !== void 0 ? _h : null,
        base_role: (_k = (_j = input.base_role) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.base_role) !== null && _k !== void 0 ? _k : null,
        is_system: (_m = (_l = input.is_system) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.is_system) !== null && _m !== void 0 ? _m : false,
        is_custom: (_p = (_o = input.is_custom) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.is_custom) !== null && _p !== void 0 ? _p : !(existing === null || existing === void 0 ? void 0 : existing.is_system),
        permissions: (_r = (_q = input.permissions) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.permissions) !== null && _r !== void 0 ? _r : [],
        inherits_from: (_t = (_s = input.inherits_from) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.inherits_from) !== null && _t !== void 0 ? _t : null,
        metadata: (_v = (_u = input.metadata) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _v !== void 0 ? _v : {},
        created_at: (_w = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _w !== void 0 ? _w : now,
        updated_at: now,
        created_by: (_y = (_x = input.created_by) !== null && _x !== void 0 ? _x : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _y !== void 0 ? _y : null,
        updated_by: (_2 = (_1 = (_0 = (_z = input.updated_by) !== null && _z !== void 0 ? _z : input.created_by) !== null && _0 !== void 0 ? _0 : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _1 !== void 0 ? _1 : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _2 !== void 0 ? _2 : null,
    };
}
function listFromStore(tenantId, filter) {
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.includeSystem) === false && row.is_system)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.includeCustom) === false && row.is_custom)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim()) {
            const s = filter.search.trim().toLowerCase();
            if (!row.name.toLowerCase().includes(s) &&
                !row.key.toLowerCase().includes(s))
                continue;
        }
        out.push(row);
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}
export async function listRoles(tenantId, filter) {
    if (tableMissing(TABLE))
        return listFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .order("name", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listFromStore(tenantId, filter);
        }
        throw err;
    }
}
export async function getRole(id, tenantId) {
    if (tableMissing(TABLE)) {
        const row = store().get(id);
        return row && row.tenant_id === tenantId ? row : null;
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
            return getRole(id, tenantId);
        }
        throw err;
    }
}
export async function getRoleByKey(key, tenantId) {
    if (tableMissing(TABLE)) {
        for (const row of store().values()) {
            if (row.tenant_id === tenantId && row.key === key)
                return row;
        }
        return null;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("key", key)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return getRoleByKey(key, tenantId);
        }
        throw err;
    }
}
export async function upsertRole(tenantId, input) {
    const existing = input.id ? await getRole(input.id, tenantId) : null;
    const next = mergeRole(existing !== null && existing !== void 0 ? existing : undefined, tenantId, input);
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
export async function deleteRole(id, tenantId) {
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
            return deleteRole(id, tenantId);
        }
        throw err;
    }
}
