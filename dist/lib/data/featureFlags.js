import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "feature_flags";
function store() {
    const g = globalThis;
    if (!g.__ziro_feature_flags_store)
        g.__ziro_feature_flags_store = new Map();
    return g.__ziro_feature_flags_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `flag_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const now = nowIso();
    const key = input.key.trim();
    return {
        id,
        tenant_id: tenantId,
        key,
        name: (_d = (_c = input.name) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _d !== void 0 ? _d : key,
        description: (_f = (_e = input.description) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.description) !== null && _f !== void 0 ? _f : null,
        enabled: (_h = (_g = input.enabled) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.enabled) !== null && _h !== void 0 ? _h : false,
        rollout_percent: typeof input.rollout_percent === "number"
            ? Math.max(0, Math.min(100, input.rollout_percent))
            : (_j = existing === null || existing === void 0 ? void 0 : existing.rollout_percent) !== null && _j !== void 0 ? _j : 100,
        target_roles: (_l = (_k = input.target_roles) !== null && _k !== void 0 ? _k : existing === null || existing === void 0 ? void 0 : existing.target_roles) !== null && _l !== void 0 ? _l : [],
        target_profile_ids: (_o = (_m = input.target_profile_ids) !== null && _m !== void 0 ? _m : existing === null || existing === void 0 ? void 0 : existing.target_profile_ids) !== null && _o !== void 0 ? _o : [],
        metadata: (_q = (_p = input.metadata) !== null && _p !== void 0 ? _p : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _q !== void 0 ? _q : {},
        created_at: (_r = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _r !== void 0 ? _r : now,
        updated_at: now,
        created_by: (_t = (_s = input.created_by) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _t !== void 0 ? _t : null,
        updated_by: (_x = (_w = (_v = (_u = input.updated_by) !== null && _u !== void 0 ? _u : input.created_by) !== null && _v !== void 0 ? _v : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _w !== void 0 ? _w : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _x !== void 0 ? _x : null,
    };
}
function listFromStore(tenantId) {
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        out.push(row);
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
}
export async function listFeatureFlags(tenantId) {
    if (tableMissing(TABLE))
        return listFromStore(tenantId);
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .order("key", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listFromStore(tenantId);
        }
        throw err;
    }
}
export async function getFeatureFlag(id, tenantId) {
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
            return getFeatureFlag(id, tenantId);
        }
        throw err;
    }
}
export async function getFeatureFlagByKey(key, tenantId) {
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
            return getFeatureFlagByKey(key, tenantId);
        }
        throw err;
    }
}
export async function upsertFeatureFlag(tenantId, input) {
    const existing = input.id
        ? await getFeatureFlag(input.id, tenantId)
        : await getFeatureFlagByKey(input.key, tenantId);
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
export async function deleteFeatureFlag(id, tenantId) {
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
            return deleteFeatureFlag(id, tenantId);
        }
        throw err;
    }
}
