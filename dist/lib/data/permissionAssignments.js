import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "permission_assignments";
function store() {
    const g = globalThis;
    if (!g.__ziro_permission_assignments_store) {
        g.__ziro_permission_assignments_store = new Map();
    }
    return g.__ziro_permission_assignments_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `pa_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function merge(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const now = nowIso();
    return {
        id: (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid(),
        tenant_id: tenantId,
        profile_id: input.profile_id,
        role_id: (_d = (_c = input.role_id) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.role_id) !== null && _d !== void 0 ? _d : null,
        permission_key: input.permission_key,
        granted: (_f = (_e = input.granted) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.granted) !== null && _f !== void 0 ? _f : true,
        reason: (_h = (_g = input.reason) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.reason) !== null && _h !== void 0 ? _h : null,
        expires_at: (_k = (_j = input.expires_at) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.expires_at) !== null && _k !== void 0 ? _k : null,
        created_at: (_l = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _l !== void 0 ? _l : now,
        updated_at: now,
        created_by: (_o = (_m = input.created_by) !== null && _m !== void 0 ? _m : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _o !== void 0 ? _o : null,
        updated_by: (_s = (_r = (_q = (_p = input.updated_by) !== null && _p !== void 0 ? _p : input.created_by) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _r !== void 0 ? _r : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _s !== void 0 ? _s : null,
    };
}
function listFromStore(tenantId, filter) {
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.profileId) && row.profile_id !== filter.profileId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.roleId) && row.role_id !== filter.roleId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.permissionKey) && row.permission_key !== filter.permissionKey)
            continue;
        out.push(row);
    }
    return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function listPermissionAssignments(tenantId, filter) {
    if (tableMissing(TABLE))
        return listFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.profileId)
            query = query.eq("profile_id", filter.profileId);
        if (filter === null || filter === void 0 ? void 0 : filter.roleId)
            query = query.eq("role_id", filter.roleId);
        if (filter === null || filter === void 0 ? void 0 : filter.permissionKey)
            query = query.eq("permission_key", filter.permissionKey);
        const { data, error } = await query.order("updated_at", {
            ascending: false,
        });
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
export async function getPermissionAssignment(id, tenantId) {
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
            return getPermissionAssignment(id, tenantId);
        }
        throw err;
    }
}
export async function upsertPermissionAssignment(tenantId, input) {
    const existing = input.id
        ? await getPermissionAssignment(input.id, tenantId)
        : null;
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
export async function deletePermissionAssignment(id, tenantId) {
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
            return deletePermissionAssignment(id, tenantId);
        }
        throw err;
    }
}
