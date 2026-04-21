import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "calendar_feeds";
const g = globalThis;
function store() {
    if (!g.__ziro_calendar_feeds_store)
        g.__ziro_calendar_feeds_store = new Map();
    return g.__ziro_calendar_feeds_store;
}
function rowTo(r) {
    return {
        id: r.id,
        tenantId: r.tenant_id,
        ownerType: r.owner_type,
        ownerId: r.owner_id,
        token: r.token,
        label: r.label,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function toRow(tenantId, input) {
    var _a;
    const now = new Date().toISOString();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : `feed_${Math.random().toString(36).slice(2, 10)}`,
        tenant_id: tenantId,
        owner_type: input.ownerType,
        owner_id: input.ownerId,
        token: input.token,
        label: input.label,
        is_active: input.isActive,
        created_at: now,
        updated_at: now,
    };
}
export async function listCalendarFeeds(tenantId, filter, opts) {
    var _a, _b, _c, _d;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.owner_type)
                q = q.eq("owner_type", filter.owner_type);
            if (filter === null || filter === void 0 ? void 0 : filter.owner_id)
                q = q.eq("owner_id", filter.owner_id);
            if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean")
                q = q.eq("is_active", filter.is_active);
            const ordered = applyListOptions(q, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return ((_d = data) !== null && _d !== void 0 ? _d : []).map(rowTo);
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
        .filter((r) => {
        if (r.tenant_id !== tenantId)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.owner_type) && r.owner_type !== filter.owner_type)
            return false;
        if ((filter === null || filter === void 0 ? void 0 : filter.owner_id) && r.owner_id !== filter.owner_id)
            return false;
        if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean" && r.is_active !== filter.is_active)
            return false;
        return true;
    })
        .map(rowTo);
}
export async function getCalendarFeed(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .maybeSingle();
            if (!error)
                return data ? rowTo(data) : null;
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
    const r = store().get(id);
    if (!r || r.tenant_id !== tenantId)
        return null;
    return rowTo(r);
}
export async function createCalendarFeed(tenantId, input) {
    const row = toRow(tenantId, input);
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .insert(row)
                .select("*")
                .single();
            if (!error)
                return rowTo(data);
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
    store().set(row.id, row);
    return rowTo(row);
}
export async function updateCalendarFeed(id, tenantId, patch) {
    const now = new Date().toISOString();
    const update = { updated_at: now };
    if (patch.ownerType !== undefined)
        update.owner_type = patch.ownerType;
    if (patch.ownerId !== undefined)
        update.owner_id = patch.ownerId;
    if (patch.token !== undefined)
        update.token = patch.token;
    if (patch.label !== undefined)
        update.label = patch.label;
    if (patch.isActive !== undefined)
        update.is_active = patch.isActive;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .update(update)
                .eq("tenant_id", tenantId)
                .eq("id", id)
                .select("*")
                .single();
            if (!error)
                return rowTo(data);
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
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) {
        throw new Error(`calendar_feed ${id} not found`);
    }
    const next = Object.assign(Object.assign({}, existing), update);
    store().set(id, next);
    return rowTo(next);
}
export async function deleteCalendarFeed(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", id);
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
    const r = store().get(id);
    if (r && r.tenant_id === tenantId)
        store().delete(id);
}
