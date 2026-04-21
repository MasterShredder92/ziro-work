import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "audit_logs";
function store() {
    const g = globalThis;
    if (!g.__ziro_audit_logs_store)
        g.__ziro_audit_logs_store = new Map();
    return g.__ziro_audit_logs_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `aud_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function matches(row, filter) {
    var _a, _b, _c;
    if (filter.event && row.event !== filter.event)
        return false;
    if (filter.category && row.category !== filter.category)
        return false;
    if (filter.actorId && row.actor_id !== filter.actorId)
        return false;
    if (filter.targetType && row.target_type !== filter.targetType)
        return false;
    if (filter.targetId && row.target_id !== filter.targetId)
        return false;
    if (filter.since && row.created_at < filter.since)
        return false;
    if (filter.until && row.created_at > filter.until)
        return false;
    if (filter.search) {
        const s = filter.search.toLowerCase();
        const hay = `${row.event} ${(_a = row.category) !== null && _a !== void 0 ? _a : ""} ${(_b = row.target_type) !== null && _b !== void 0 ? _b : ""} ${(_c = row.target_id) !== null && _c !== void 0 ? _c : ""}`.toLowerCase();
        if (!hay.includes(s))
            return false;
    }
    return true;
}
function listFromStore(tenantId, filter) {
    var _a, _b;
    const rows = [];
    for (const row of store().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if (filter && !matches(row, filter))
            continue;
        rows.push(row);
    }
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const limit = (_a = filter === null || filter === void 0 ? void 0 : filter.limit) !== null && _a !== void 0 ? _a : 200;
    const offset = (_b = filter === null || filter === void 0 ? void 0 : filter.offset) !== null && _b !== void 0 ? _b : 0;
    return rows.slice(offset, offset + limit);
}
export async function listAuditLogs(tenantId, filter) {
    var _a, _b;
    if (tableMissing(TABLE))
        return listFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.event)
            query = query.eq("event", filter.event);
        if (filter === null || filter === void 0 ? void 0 : filter.category)
            query = query.eq("category", filter.category);
        if (filter === null || filter === void 0 ? void 0 : filter.actorId)
            query = query.eq("actor_id", filter.actorId);
        if (filter === null || filter === void 0 ? void 0 : filter.targetType)
            query = query.eq("target_type", filter.targetType);
        if (filter === null || filter === void 0 ? void 0 : filter.targetId)
            query = query.eq("target_id", filter.targetId);
        if (filter === null || filter === void 0 ? void 0 : filter.since)
            query = query.gte("created_at", filter.since);
        if (filter === null || filter === void 0 ? void 0 : filter.until)
            query = query.lte("created_at", filter.until);
        query = query.order("created_at", { ascending: false });
        const limit = (_a = filter === null || filter === void 0 ? void 0 : filter.limit) !== null && _a !== void 0 ? _a : 200;
        const offset = (_b = filter === null || filter === void 0 ? void 0 : filter.offset) !== null && _b !== void 0 ? _b : 0;
        if (typeof limit === "number") {
            query = query.range(offset, offset + Math.max(0, limit - 1));
        }
        const { data, error } = await query;
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
export async function insertAuditLog(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : uuid(),
        tenant_id: tenantId,
        event: input.event,
        category: (_b = input.category) !== null && _b !== void 0 ? _b : null,
        actor_id: (_c = input.actor_id) !== null && _c !== void 0 ? _c : null,
        actor_role: (_d = input.actor_role) !== null && _d !== void 0 ? _d : null,
        actor_ip: (_e = input.actor_ip) !== null && _e !== void 0 ? _e : null,
        target_type: (_f = input.target_type) !== null && _f !== void 0 ? _f : null,
        target_id: (_g = input.target_id) !== null && _g !== void 0 ? _g : null,
        before: (_h = input.before) !== null && _h !== void 0 ? _h : null,
        after: (_j = input.after) !== null && _j !== void 0 ? _j : null,
        diff: (_k = input.diff) !== null && _k !== void 0 ? _k : null,
        payload: (_l = input.payload) !== null && _l !== void 0 ? _l : null,
        created_at: (_m = input.created_at) !== null && _m !== void 0 ? _m : nowIso(),
    };
    if (tableMissing(TABLE)) {
        store().set(row.id, row);
        return row;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .insert(row)
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            store().set(row.id, row);
            return row;
        }
        throw err;
    }
}
export async function purgeOlderThan(tenantId, before) {
    if (tableMissing(TABLE)) {
        let removed = 0;
        for (const [id, row] of store().entries()) {
            if (row.tenant_id === tenantId && row.created_at < before) {
                store().delete(id);
                removed += 1;
            }
        }
        return removed;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error, count } = await supabase
            .from(TABLE)
            .delete({ count: "exact" })
            .eq("tenant_id", tenantId)
            .lt("created_at", before);
        if (error)
            throw error;
        return count !== null && count !== void 0 ? count : 0;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return purgeOlderThan(tenantId, before);
        }
        throw err;
    }
}
